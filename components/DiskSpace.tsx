'use client';

import { HardDrive, AlertTriangle, CheckCircle } from 'lucide-react';

interface DiskSpaceProps {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  usagePercent: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getUsageColor(usagePercent: number): string {
  if (usagePercent >= 90) return 'bg-red-500';
  if (usagePercent >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getUsageIcon(usagePercent: number) {
  if (usagePercent >= 90) return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
  if (usagePercent >= 70) return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
  return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
}

export default function DiskSpace({
  totalSpace,
  usedSpace,
  freeSpace,
  usagePercent,
}: DiskSpaceProps) {
  const usageColor = getUsageColor(usagePercent);
  const usageIcon = getUsageIcon(usagePercent);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 py-2.5 dark:from-zinc-900/50 dark:to-zinc-800/50">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <HardDrive className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">磁盘</span>
            {usageIcon}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full ${usageColor} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              {usagePercent.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
      <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex items-center gap-3 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">已用</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {formatBytes(usedSpace)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">可用</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {formatBytes(freeSpace)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">总空间</span>
          <span className="font-semibold text-zinc-900 dark:text-white">
            {formatBytes(totalSpace)}
          </span>
        </div>
      </div>
    </div>
  );
}
