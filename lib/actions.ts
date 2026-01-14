'use server';

import fs from 'fs/promises';
import path from 'path';
import { v7 as uuidv7 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { FileMetadata, DiskSpaceInfo } from './types';
import db from './db';

const UPLOADS_DIR = process.env.STORAGE_PATH || path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(process.cwd(), 'temp_chunks');

async function ensureDirs() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function uploadFiles(formData: FormData) {
  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) throw new Error('No files uploaded');

  await ensureDirs();
  const remark = (formData.get('remark') as string) || '';

  const newFiles: FileMetadata[] = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const id = uuidv7();
    const extension = path.extname(file.name);
    const fileName = `${id}${extension}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await fs.writeFile(filePath, buffer);

    newFiles.push({
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date().toISOString(),
      remark: remark,
      path: fileName,
    });
  }

  const insert = db.prepare(`
    INSERT INTO files (id, name, size, type, uploadDate, remark, path)
    VALUES (@id, @name, @size, @type, @uploadDate, @remark, @path)
  `);

  const insertMany = db.transaction((files: FileMetadata[]) => {
    for (const file of files) {
      insert.run(file);
    }
  });

  insertMany(newFiles);

  revalidatePath('/');
  return { success: true };
}

export async function listFiles() {
  return db.prepare('SELECT * FROM files ORDER BY uploadDate DESC').all() as FileMetadata[];
}

export async function deleteFile(id: string) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileMetadata | undefined;

  if (!file) throw new Error('File not found');

  const filePath = path.join(UPLOADS_DIR, file.path);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete physical file:', error);
  }

  db.prepare('DELETE FROM files WHERE id = ?').run(id);

  revalidatePath('/');
  return { success: true };
}

export async function updateRemark(id: string, remark: string) {
  const result = db.prepare('UPDATE files SET remark = ? WHERE id = ?').run(remark, id);

  if (result.changes === 0) throw new Error('File not found');

  revalidatePath('/');
  return { success: true };
}

export async function renameFile(id: string, newName: string) {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as FileMetadata | undefined;
  if (!file) throw new Error('File not found');

  const oldExtension = path.extname(file.name);
  const newExtension = path.extname(newName);

  // 如果新名称没有扩展名，或者扩展名不匹配，则使用原扩展名
  if (!newExtension || newExtension !== oldExtension) {
    newName = newName + oldExtension;
  }

  db.prepare('UPDATE files SET name = ? WHERE id = ?').run(newName, id);

  revalidatePath('/');
  return { success: true };
}

// Chunked Upload Actions

export async function initiateChunkUpload() {
  await ensureDirs();
  const uploadId = uuidv7();
  const uploadDir = path.join(TEMP_DIR, uploadId);
  await fs.mkdir(uploadDir, { recursive: true });
  return { uploadId };
}

export async function uploadChunk(uploadId: string, chunkIndex: number, formData: FormData) {
  const chunk = formData.get('chunk') as File;
  if (!chunk) throw new Error('No chunk found');

  const buffer = Buffer.from(await chunk.arrayBuffer());
  const chunkPath = path.join(TEMP_DIR, uploadId, `chunk-${chunkIndex}`);
  await fs.writeFile(chunkPath, buffer);
  return { success: true };
}

export async function completeChunkUpload(
  uploadId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  totalChunks: number,
  remark: string,
) {
  const uploadDir = path.join(TEMP_DIR, uploadId);
  const id = uuidv7();
  const extension = path.extname(fileName);
  const finalFileName = `${id}${extension}`;
  const finalFilePath = path.join(UPLOADS_DIR, finalFileName);

  // Merge chunks
  const writeStream = await fs.open(finalFilePath, 'w');

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`);
      const chunkData = await fs.readFile(chunkPath);
      await writeStream.write(chunkData);
      // Optional: Delete chunk immediately to save space, but safer to delete all at end
    }
  } finally {
    await writeStream.close();
  }

  // Cleanup temp dir
  await fs.rm(uploadDir, { recursive: true, force: true });

  // Update metadata
  const newFile: FileMetadata = {
    id,
    name: fileName,
    size: fileSize,
    type: fileType,
    uploadDate: new Date().toISOString(),
    remark: remark,
    path: finalFileName,
  };

  db.prepare(`
    INSERT INTO files (id, name, size, type, uploadDate, remark, path)
    VALUES (@id, @name, @size, @type, @uploadDate, @remark, @path)
  `).run(newFile);

  revalidatePath('/');

  return { success: true };
}

export async function deleteMultipleFiles(ids: string[]) {
  if (ids.length === 0) return { success: true, count: 0 };

  const placeholders = ids.map(() => '?').join(',');
  const filesToDelete = db.prepare(`SELECT * FROM files WHERE id IN (${placeholders})`).all(...ids) as FileMetadata[];

  await Promise.allSettled(
    filesToDelete.map(async (file) => {
      const filePath = path.join(UPLOADS_DIR, file.path);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${file.path}:`, error);
      }
    }),
  );

  db.prepare(`DELETE FROM files WHERE id IN (${placeholders})`).run(...ids);

  revalidatePath('/');
  return { success: true, count: filesToDelete.length };
}

export async function getDiskSpace(): Promise<DiskSpaceInfo> {
  try {
    await ensureDirs();
    const stats = await fs.statfs(UPLOADS_DIR);
    const totalSpace = stats.bsize * stats.blocks;
    const freeSpace = stats.bsize * stats.bavail;
    const usedSpace = totalSpace - freeSpace;
    const usagePercent = (usedSpace / totalSpace) * 100;

    return {
      totalSpace,
      usedSpace,
      freeSpace,
      usagePercent,
    };
  } catch (error) {
    console.error('Failed to get disk space:', error);
    return {
      totalSpace: 0,
      usedSpace: 0,
      freeSpace: 0,
      usagePercent: 0,
    };
  }
}
