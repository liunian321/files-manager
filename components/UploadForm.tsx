'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { initiateChunkUpload, uploadChunk, completeChunkUpload } from '@/lib/actions';
import FileUploadZone from './FileUploadZone';
import FileSelectionList from './FileSelectionList';
import { useFiles } from '@/lib/hooks/useFiles';

export default function UploadForm() {
  const { files, addFiles, removeFile, clearFiles } = useFiles();
  const [remark, setRemark] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Chunk size: 5MB
  const CHUNK_SIZE = 5 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    let uploadedBytes = 0;

    try {
      for (const file of files) {
        // Calculate chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        // Initiate upload
        const { uploadId } = await initiateChunkUpload();

        // Upload chunks sequentially
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunk);

          await uploadChunk(uploadId, i, formData);

          uploadedBytes += chunk.size;
          // Update progress
          setProgress(Math.min((uploadedBytes / totalSize) * 100, 99));
        }

        // Complete upload
        await completeChunkUpload(uploadId, file.name, file.size, file.type, totalChunks, remark);
      }

      setProgress(100);
      setTimeout(() => {
        clearFiles();
        setRemark('');
        setProgress(0);
        setIsUploading(false);
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败，请重试');
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FileUploadZone onFilesSelected={addFiles} hasFiles={files.length > 0} />
        <FileSelectionList files={files} onRemove={removeFile} onClear={clearFiles} />

        {files.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-4 duration-300">
            <input
              type="text"
              placeholder="添加备注 (可选)..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-medium transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />

            <div className="relative">
              {isUploading && (
                <div className="mb-2">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>上传进度</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    正在为您上传...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    开始上传 ({files.length} 个文件)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
