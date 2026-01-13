'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  hasFiles: boolean;
}

export default function FileUploadZone({ onFilesSelected, hasFiles }: FileUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files) {
        onFilesSelected(Array.from(e.dataTransfer.files));
      }
    },
    [onFilesSelected],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onFilesSelected(Array.from(e.target.files));
      }
    },
    [onFilesSelected],
  );

  return (
    <div
      className={cn(
        'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all',
        dragActive
          ? 'scale-[1.01] border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
          : 'border-zinc-200/50 bg-white/40 hover:border-zinc-300/50 hover:bg-white/60 dark:border-zinc-700/50 dark:bg-zinc-900/30 dark:hover:border-zinc-600/50 dark:hover:bg-zinc-900/50',
        hasFiles && 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-900/5',
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleChange}
        id="file-upload-input"
      />

      {!hasFiles ? (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-transform dark:bg-zinc-800/80">
            <Upload className="h-8 w-8 text-zinc-400" />
          </div>
          <p className="mb-1 text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              点击上传
            </span>{' '}
            或拖拽文件至此
          </p>
          <p className="text-sm text-zinc-500">支持多文件批量上传</p>
        </>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="mb-2 h-8 w-8 text-blue-500" />
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">继续添加更多文件</p>
        </div>
      )}
    </div>
  );
}
