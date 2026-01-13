'use server';

import fs from 'fs/promises';
import path from 'path';
import { v7 as uuidv7 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { FileMetadata, DiskSpaceInfo } from './types';
import { cache } from 'react';

const UPLOADS_DIR = process.env.STORAGE_PATH || path.join(process.cwd(), 'uploads');
const TEMP_DIR = path.join(process.cwd(), 'temp_chunks');
const METADATA_FILE = path.join(process.cwd(), 'data', 'files.json');

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

const getMetadata = cache(async (): Promise<FileMetadata[]> => {
  try {
    const data = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
});

async function saveMetadata(metadata: FileMetadata[]) {
  await fs.mkdir(path.dirname(METADATA_FILE), { recursive: true });
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

export async function uploadFiles(formData: FormData) {
  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) throw new Error('No files uploaded');

  await ensureDirs();
  const metadata = await getMetadata();
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

  await saveMetadata([...metadata, ...newFiles]);
  revalidatePath('/');
  return { success: true };
}

export async function listFiles() {
  return await getMetadata();
}

export async function deleteFile(id: string) {
  const metadata = await getMetadata();
  const file = metadata.find((f) => f.id === id);

  if (!file) throw new Error('File not found');

  const filePath = path.join(UPLOADS_DIR, file.path);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Failed to delete physical file:', error);
  }

  const newMetadata = metadata.filter((f) => f.id !== id);
  await saveMetadata(newMetadata);

  revalidatePath('/');
  return { success: true };
}

export async function updateRemark(id: string, remark: string) {
  const metadata = await getMetadata();
  const fileIndex = metadata.findIndex((f) => f.id === id);

  if (fileIndex === -1) throw new Error('File not found');

  metadata[fileIndex].remark = remark;
  await saveMetadata(metadata);

  revalidatePath('/');
  return { success: true };
}

export async function renameFile(id: string, newName: string) {
  const metadata = await getMetadata();
  const fileIndex = metadata.findIndex((f) => f.id === id);

  if (fileIndex === -1) throw new Error('File not found');

  const oldFile = metadata[fileIndex];
  const extension = path.extname(oldFile.name);
  const newExtension = path.extname(newName);

  // 如果新名称没有扩展名，或者扩展名不匹配，则使用原扩展名
  if (!newExtension || newExtension !== extension) {
    newName = newName + extension;
  }

  // 更新文件名
  metadata[fileIndex].name = newName;
  await saveMetadata(metadata);

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
  const metadata = await getMetadata();
  const newFile: FileMetadata = {
    id,
    name: fileName,
    size: fileSize,
    type: fileType,
    uploadDate: new Date().toISOString(),
    remark: remark,
    path: finalFileName,
  };

  await saveMetadata([...metadata, newFile]);
  revalidatePath('/');

  return { success: true };
}

export async function deleteMultipleFiles(ids: string[]) {
  const metadata = await getMetadata();
  const validIds = new Set(ids);

  const filesToDelete = metadata.filter((f) => validIds.has(f.id));
  const newMetadata = metadata.filter((f) => !validIds.has(f.id));

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

  await saveMetadata(newMetadata);
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
