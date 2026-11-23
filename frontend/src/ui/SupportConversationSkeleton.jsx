import SkeletonBlock from "./SkeletonBlock";

export default function SupportConversationSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading conversation" className="mx-auto max-w-4xl overflow-hidden rounded-md border border-[#cfddd5] bg-white">
      <span className="sr-only">Loading conversation...</span>
      <div aria-hidden="true">
        <div className="flex items-center gap-3 border-b border-[#e1e9e4] p-4 sm:p-5"><SkeletonBlock className="size-10 shrink-0" /><div className="min-w-0 flex-1"><SkeletonBlock className="h-4 w-32 max-w-full" /><SkeletonBlock className="mt-2 h-3 w-48 max-w-full" /></div></div>
        <div className="flex items-center justify-between gap-4 border-b border-[#e1e9e4] bg-[#f6f8f7] p-4"><SkeletonBlock className="h-4 w-28" /><SkeletonBlock className="h-8 w-24" /></div>
        <div className="h-[min(50dvh,28rem)] min-h-64 space-y-5 bg-[#f6f8f7] p-4 sm:p-5">
          <div className="w-3/4 space-y-2 rounded-md border border-[#e1e9e4] bg-white p-4"><SkeletonBlock className="h-3 w-full" /><SkeletonBlock className="h-3 w-4/5" /><SkeletonBlock className="h-2 w-16" /></div>
          <div className="ml-auto w-2/3 space-y-2 rounded-md bg-[#e5eee8] p-4"><SkeletonBlock className="h-3 w-24 max-w-full" /><SkeletonBlock className="h-3 w-full" /><SkeletonBlock className="h-3 w-3/4" /></div>
          <div className="w-1/2 space-y-2 rounded-md border border-[#e1e9e4] bg-white p-4"><SkeletonBlock className="h-3 w-full" /><SkeletonBlock className="h-2 w-16" /></div>
        </div>
        <div className="space-y-3 border-t border-[#e1e9e4] p-4 sm:p-5"><SkeletonBlock className="h-16 w-full" /><div className="flex justify-between gap-3"><SkeletonBlock className="h-10 w-28" /><SkeletonBlock className="h-10 w-28" /></div></div>
      </div>
    </div>
  );
}
