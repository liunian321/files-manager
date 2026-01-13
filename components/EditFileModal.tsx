'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, FileText } from 'lucide-react';
import { FileMetadata } from '@/lib/types';
import { renameFile, updateRemark } from '@/lib/actions';
import { splitFileName } from '@/lib/utils';

interface EditFileModalProps {
  file: FileMetadata;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditFileModal({ file, isOpen, onClose }: EditFileModalProps) {
  const { name: initialName, extension } = splitFileName(file.name);
  const [name, setName] = useState(initialName);
  const [remark, setRemark] = useState(file.remark || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const { name: n } = splitFileName(file.name);
      setName(n);
      setRemark(file.remark || '');
      setError('');
    }
  }, [isOpen, file]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('文件名不能为空');
      return;
    }

    const fullName = extension ? `${trimmedName}${extension}` : trimmedName;
    setIsLoading(true);
    setError('');

    try {
      // If name changed, rename
      if (fullName !== file.name) {
        await renameFile(file.id, fullName);
      }
      // If remark changed, update
      if (remark !== (file.remark || '')) {
        await updateRemark(file.id, remark);
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败，请稍后重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl duration-200 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">编辑文件信息</h2>
              <p className="text-xs text-zinc-500">修改文件名和备注</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Filename Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">文件名</label>
            <div className="group relative flex items-center">
              <div className="flex w-full items-center rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950/50">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  autoFocus
                  className="flex-grow bg-transparent font-medium text-zinc-900 outline-none dark:text-white"
                  placeholder="请输入文件名"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                {extension && (
                  <span className="ml-1 truncate font-medium text-zinc-400 select-none">
                    {extension}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Remark Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">备注</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white"
              placeholder="在此输入文件备注..."
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-grow rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex flex-grow items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <X className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存修改
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
