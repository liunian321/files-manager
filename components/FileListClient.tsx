'use client';

import { useState, useCallback } from 'react';
import { FileMetadata } from '@/lib/types';
import FileItem from './FileItem';
import FileGridItem from './FileGridItem';
import {
  LayoutGrid,
  List as ListIcon,
  Trash2,
  CheckSquare,
  X,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { deleteMultipleFiles } from '@/lib/actions';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

interface FileListClientProps {
  files: FileMetadata[];
  totalFiles: number;
  currentPage: number;
  limit: number;
}

export default function FileListClient({
  files: initialFiles,
  totalFiles,
  currentPage,
  limit,
}: FileListClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Reset selection when files change (e.g. page change)
  // This is optional - sometimes users want to select across pages.
  // But for simple implementation, clearing is safer to avoid deleting invisible items.
  // We can key the component on page to auto-reset, or use useEffect.

  const totalPages = Math.ceil(totalFiles / limit);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === initialFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialFiles.map((f) => f.id)));
    }
  }, [selectedIds, initialFiles]);

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个文件吗?`)) return;

    setIsDeleting(true);
    try {
      await deleteMultipleFiles(Array.from(selectedIds));
      setSelectedIds(new Set());
      router.refresh();
    } catch {
      alert('批量删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (initialFiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <HardDrive className="mb-4 h-12 w-12 opacity-20" />
        <p>{searchParams.get('search') ? '未找到匹配文件' : '暂无上传文件'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/50">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100/50 bg-zinc-50/30 px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                selectedIds.size > 0
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700',
              )}
            >
              <CheckSquare
                className={cn(
                  'h-4 w-4',
                  selectedIds.size > 0 && selectedIds.size < initialFiles.length && 'opacity-50',
                )}
              />
              <span className="hidden sm:inline">
                {selectedIds.size > 0 ? `已选 ${selectedIds.size} 项` : '全选'}
              </span>
            </button>

            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">删除</span>
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="取消选择"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md p-1.5 transition-all',
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300',
              )}
              title="列表视图"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-md p-1.5 transition-all',
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                  : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300',
              )}
              title="网格视图"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <div className="ml-2 hidden border-l border-zinc-200 pl-4 text-xs text-zinc-400 sm:block dark:border-zinc-700">
            {totalFiles} 个文件
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'min-h-[500px] p-4',
          viewMode === 'list'
            ? 'divide-y divide-zinc-100/50 dark:divide-zinc-800/50'
            : 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
        )}
      >
        {initialFiles.map((file) =>
          viewMode === 'list' ? (
            <FileItem
              key={file.id}
              file={file}
              isSelected={selectedIds.has(file.id)}
              onSelect={() => toggleSelectOne(file.id)}
              selectionMode={selectedIds.size > 0}
            />
          ) : (
            <FileGridItem
              key={file.id}
              file={file}
              isSelected={selectedIds.has(file.id)}
              onSelect={() => toggleSelectOne(file.id)}
              selectionMode={selectedIds.size > 0}
            />
          ),
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-100/50 bg-zinc-50/30 px-6 py-4 dark:border-zinc-800/50 dark:bg-zinc-900/30">
          <div className="text-xs text-zinc-500">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={createPageUrl(currentPage - 1)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700',
                currentPage <= 1 && 'pointer-events-none opacity-50',
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={createPageUrl(currentPage + 1)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700',
                currentPage >= totalPages && 'pointer-events-none opacity-50',
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
