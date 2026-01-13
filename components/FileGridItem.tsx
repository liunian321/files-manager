import { useState } from 'react';
import { Trash2, Download, MessageSquare, Check, Eye, Edit3 } from 'lucide-react';
import { deleteFile } from '@/lib/actions';
import { FileMetadata } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import FilePreview from './FilePreview';
import FileIcon from './FileIcon';
import { cn } from '@/lib/utils';
import EditFileModal from './EditFileModal';

interface FileGridItemProps {
  file: FileMetadata;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
}

export default function FileGridItem({
  file,
  isSelected = false,
  onSelect,
  selectionMode = false,
}: FileGridItemProps) {
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

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(!isSelected);
    } else {
      if (onSelect) onSelect(!isSelected);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          'group relative flex flex-col rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-zinc-900/50',
          isSelected
            ? 'border-blue-500 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
            : 'border-zinc-200/50 hover:border-zinc-300 dark:border-zinc-700/50 dark:hover:border-zinc-600',
        )}
      >
        {/* Selection Checkbox */}
        <div
          className={cn(
            'absolute top-2 right-2 z-10',
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <div
            className={cn(
              'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition-colors',
              isSelected
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-zinc-300 bg-white hover:border-blue-400 dark:border-zinc-600 dark:bg-zinc-800',
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(!isSelected);
            }}
          >
            {isSelected && <Check className="h-3.5 w-3.5" />}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center py-4">
          <div className="scale-150 transform transition-transform group-hover:scale-105">
            <FileIcon type={file.type} />
          </div>
        </div>

        <div className="min-w-0 flex-grow text-center">
          <div className="mb-1 flex items-center justify-center gap-1">
            <h3
              className="truncate text-sm font-medium text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400"
              title={file.name}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
            >
              {file.name}
            </h3>
            <button
              onClick={handleEditClick}
              className="rounded p-1 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title="编辑信息"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-zinc-400">{formatBytes(file.size)}</p>

          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(true);
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              title="预览"
            >
              <Eye className="h-4 w-4" />
            </button>
            <a
              href={`/api/download/${file.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              title="下载"
            >
              <Download className="h-4 w-4" />
            </a>
            {!selectionMode && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Remark at bottom */}
        <div className="mt-3 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
          <div
            className="group/remark flex cursor-pointer items-center justify-center gap-1 text-zinc-400 transition-colors hover:text-blue-500"
            onClick={handleEditClick}
          >
            <MessageSquare className="h-3 w-3" />
            <span className="max-w-[150px] truncate italic">{file.remark || '无备注'}</span>
          </div>
        </div>
      </div>

      {showPreview && <FilePreview file={file} onClose={() => setShowPreview(false)} />}
      <EditFileModal file={file} isOpen={showEditModal} onClose={() => setShowEditModal(false)} />
    </>
  );
}
