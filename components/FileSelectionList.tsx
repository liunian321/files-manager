'use client';

import { File, X } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface FileSelectionListProps {
  files: File[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export default function FileSelectionList({ files, onRemove, onClear }: FileSelectionListProps) {
  if (files.length === 0) return null;

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="w-full space-y-3 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-500">
          已选定 {files.length} 个文件 ({formatBytes(totalSize)})
        </span>
        <button type="button" onClick={onClear} className="text-xs text-red-500 hover:underline">
          清除全部
        </button>
      </div>
      <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
        {files.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="animate-in fade-in slide-in-from-bottom-2 flex items-center gap-3 rounded-xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-800"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-zinc-100 dark:bg-zinc-700">
              <File className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-grow text-left">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-[10px] text-zinc-500">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className="rounded-full p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
