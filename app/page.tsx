import { Suspense } from 'react';
import UploadForm from '@/components/UploadForm';
import FileList from '@/components/FileList';
import SearchSort from '@/components/SearchSort';
import DiskSpace from '@/components/DiskSpace';
import { FolderOpen, Sparkles } from 'lucide-react';
import { getDiskSpace } from '@/lib/actions';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    order?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const diskSpace = await getDiskSpace();

  return (
    <div className="relative min-h-screen selection:bg-blue-500/20">
      {/* Background Gradients */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-zinc-50 dark:bg-black">
        <div className="absolute top-0 -left-4 h-96 w-96 rounded-full bg-blue-400/20 opacity-70 mix-blend-multiply blur-3xl dark:bg-blue-900/20 dark:mix-blend-screen" />
        <div className="absolute top-0 -right-4 h-96 w-96 rounded-full bg-purple-400/20 opacity-70 mix-blend-multiply blur-3xl dark:bg-purple-900/20 dark:mix-blend-screen" />
        <div className="absolute -bottom-8 left-20 h-96 w-96 rounded-full bg-indigo-400/20 opacity-70 mix-blend-multiply blur-3xl dark:bg-indigo-900/20 dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] bg-center" />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        {/* Header Section */}
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-sm text-blue-800 backdrop-blur-sm dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            <span className="font-medium">全新升级</span>
          </div>

          <h1 className="mb-6 bg-gradient-to-b from-zinc-900 to-zinc-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-6xl dark:from-white dark:to-zinc-400">
            Nova Files
          </h1>

          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            为您打造的下一代文件管理体验。
            <br className="hidden sm:block" />
            极简设计，极致速度，安全无忧。
          </p>
        </header>

        {/* Main Content Card */}
        <main className="relative rounded-3xl border border-white/20 bg-white/50 shadow-xl ring-1 shadow-zinc-200/50 ring-zinc-900/5 backdrop-blur-xl dark:bg-zinc-900/50 dark:shadow-black/50 dark:ring-white/10">
          <div className="grid gap-1 lg:grid-cols-[360px,1fr]">
            {/* Left Sidebar / Upload Section */}
            <div className="border-b border-zinc-100 p-6 lg:border-r lg:border-b-0 dark:border-zinc-800">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <h2 className="font-semibold text-zinc-900 dark:text-white">上传文件</h2>
              </div>
              <UploadForm />
            </div>

            {/* Right Content / List Section */}
            <div className="flex min-h-[600px] flex-col bg-white/40 p-6 dark:bg-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-lg shadow-zinc-500/30 dark:bg-white dark:text-zinc-900">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </div>
                  <h2 className="font-semibold text-zinc-900 dark:text-white">文件库</h2>
                </div>
                <DiskSpace {...diskSpace} />
              </div>

              <SearchSort />

              <div className="mt-5 flex-1">
                <Suspense
                  key={JSON.stringify(params)}
                  fallback={
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-32 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                        />
                      ))}
                    </div>
                  }
                >
                  <FileList
                    search={params.search}
                    sortBy={params.sortBy}
                    order={params.order}
                    page={parseInt(params.page || '1', 10)}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
          <p>Designed & Built with Next.js 15 & Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}
