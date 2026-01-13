'use client';

import { useState } from 'react';
import { Trash2, Download, MessageSquare, Eye, Edit3, Check } from 'lucide-react';
import { deleteFile } from '@/lib/actions';
import { FileMetadata } from '@/lib/types';
import { cn, formatBytes } from '@/lib/utils';
import { format } from 'date-fns';
import FilePreview from './FilePreview';
import FileIcon from './FileIcon';
import EditFileModal from './EditFileModal';

interface FileItemProps {
  file: FileMetadata;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
}

export default function FileItem({
  file,
  isSelected = false,
  onSelect,
  selectionMode = false,
}: FileItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除文件 ${file.name} 吗?`)) return;
    setIsLoading(true);
    try {
      await deleteFile(file.id);
    } catch {
      alert('删除失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  return (
    <div
      onClick={() => onSelect?.(!isSelected)}
      className={cn(
        'group relative flex items-center gap-4 border-b p-4 text-left transition-all last:border-0',
        isSelected
          ? 'bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
          : 'border-zinc-100/50 hover:bg-blue-50/30 dark:border-zinc-800/50 dark:hover:bg-blue-900/10',
      )}
    >
      {/* Selection Checkbox */}
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-200',
          selectionMode || isSelected ? 'w-6 opacity-100' : 'w-0 overflow-hidden opacity-0',
        )}
      >
        <div
          className={cn(
            'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition-colors',
            isSelected
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-zinc-300 bg-white hover:border-blue-400 dark:border-zinc-600 dark:bg-zinc-800',
          )}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </div>
      </div>

      <div className="flex-shrink-0">
        <FileIcon type={file.type} />
      </div>

      <div className="min-w-0 flex-grow">
        <div className="flex items-center gap-2">
          <span
            className="truncate font-medium text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setShowPreview(true);
            }}
            title="双击预览"
          >
            {file.name}
          </span>
          <span className="text-xs text-zinc-400">{formatBytes(file.size)}</span>
          <button
            onClick={handleEditClick}
            className="rounded p-1 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="编辑信息"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
          <span>{format(new Date(file.uploadDate), 'yyyy-MM-dd HH:mm')}</span>
          <div
            className="flex cursor-pointer items-center gap-1 transition-colors hover:text-blue-500"
            onClick={handleEditClick}
          >
            <MessageSquare className="h-3 w-3" />
            <span className="max-w-[300px] truncate italic">{file.remark || '添加备注...'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1 transition-opacity group-hover:opacity-100 md:opacity-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          title="预览"
        >
          <Eye className="h-4 w-4" />
        </button>
        <a
          href={`/api/download/${file.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          title="下载"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          title="删除"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {showPreview && <FilePreview file={file} onClose={() => setShowPreview(false)} />}
      <EditFileModal file={file} isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </div>
  );
}
