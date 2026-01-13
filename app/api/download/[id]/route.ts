import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { listFiles } from '@/lib/actions';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const metadata = await listFiles();
    const fileInfo = metadata.find((f) => f.id === id);

    if (!fileInfo) {
      return new NextResponse('File not found', { status: 404 });
    }

    const filePath = path.join(UPLOADS_DIR, fileInfo.path);

    try {
      await fs.access(filePath);
    } catch {
      return new NextResponse('Physical file not found', { status: 404 });
    }

    const fileStream = createReadStream(filePath);

    return new NextResponse(fileStream as unknown as ReadableStream, {
      headers: {
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.name)}"`,
        'Content-Type': fileInfo.type || 'application/octet-stream',
        'Content-Length': fileInfo.size.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
