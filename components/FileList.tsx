import { listFiles } from '@/lib/actions';
import FileListClient from './FileListClient';

interface FileListProps {
  search?: string;
  sortBy?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export default async function FileList({
  search,
  sortBy = 'date',
  order = 'desc',
  page = 1,
  limit = 12,
}: FileListProps) {
  const allFiles = await listFiles();

  // Filter & Sort in one pass or cleanly
  const sortedFiles = allFiles
    .filter((f) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return f.name.toLowerCase().includes(s) || (f.remark && f.remark.toLowerCase().includes(s));
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else {
        comparison = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      }
      return order === 'desc' ? -comparison : comparison;
    });

  const totalPages = Math.ceil(sortedFiles.length / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));
  const start = (currentPage - 1) * limit;
  const paginatedFiles = sortedFiles.slice(start, start + limit);

  return (
    <FileListClient
      files={paginatedFiles}
      totalFiles={sortedFiles.length}
      currentPage={currentPage}
      limit={limit}
    />
  );
}
