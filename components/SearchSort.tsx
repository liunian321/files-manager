'use client';

import { Search, ChevronDown } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SearchSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Debounced search
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (search === currentSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, pathname, router, searchParams]);

  const setSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const [field, order] = value.split('-');
    params.set('sortBy', field);
    params.set('order', order);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const currentSort = `${searchParams.get('sortBy') || 'date'}-${
    searchParams.get('order') || 'desc'
  }`;

  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row">
      <div className="relative flex-grow">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="搜索文件名或备注..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-zinc-200/50 bg-white/50 py-2.5 pr-4 pl-10 backdrop-blur-sm transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
        />
      </div>

      <div className="relative min-w-[200px]">
        <select
          value={currentSort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-200/50 bg-white/50 py-2.5 pr-10 pl-4 backdrop-blur-sm transition-all outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
        >
          <option value="date-desc">上传时间 (最新)</option>
          <option value="date-asc">上传时间 (最早)</option>
          <option value="name-asc">名称 (A-Z)</option>
          <option value="name-desc">名称 (Z-A)</option>
          <option value="size-desc">大小 (从大到小)</option>
          <option value="size-asc">大小 (从小到大)</option>
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}
