export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  remark?: string;
  path: string;
}

export interface DiskSpaceInfo {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  usagePercent: number;
}

export type SortField = 'name' | 'size' | 'date';
export type SortOrder = 'asc' | 'desc';
