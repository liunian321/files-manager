'use client';

import { X, Download } from 'lucide-react';
import Image from 'next/image';
import { FileMetadata } from '@/lib/types';
import { useEffect, useState } from 'react';
import { formatBytes } from '@/lib/utils';

interface FilePreviewProps {
  file: FileMetadata;
  onClose: () => void;
}

export default function FilePreview({ file, onClose }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';
  const isCode =
    file.type.startsWith('text/') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.js') ||
    file.name.endsWith('.ts') ||
    file.name.endsWith('.tsx') ||
    file.name.endsWith('.py') ||
    file.name.endsWith('.md');

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(isCode);
  const [prevId, setPrevId] = useState(file.id);

  // Reset state when file changes
  if (file.id !== prevId) {
    setPrevId(file.id);
    setLoading(isCode);
    setContent(null);
  }

  useEffect(() => {
    if (isCode) {
      fetch(`/api/download/${file.id}`)
        .then((res) => res.text())
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    // Disable scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [file.id, isCode]);

  const downloadUrl = `/api/download/${file.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <h3 className="max-w-[200px] truncate font-semibold md:max-w-md">{file.name}</h3>
            <span className="text-xs text-zinc-400">{formatBytes(file.size)}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download={file.name}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="下载"
            >
              <Download className="h-5 w-5" />
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto bg-zinc-50 p-4 dark:bg-black/50">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
            </div>
          ) : isImage ? (
            <div className="flex h-full w-full items-center justify-center">
              <Image
                src={downloadUrl}
                alt={file.name}
                width={1200}
                height={800}
                unoptimized
                className="max-h-full max-w-full rounded object-contain shadow-lg"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={`${downloadUrl}#toolbar=0`}
              className="h-full w-full rounded border-0"
              title={file.name}
            />
          ) : isCode ? (
            <pre className="p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
              {content}
            </pre>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-zinc-400">
              <p>该文件类型暂不支持在线预览</p>
              <a
                href={downloadUrl}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                下载查看
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
