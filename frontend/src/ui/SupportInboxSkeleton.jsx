import SkeletonBlock from "./SkeletonBlock";

export default function SupportInboxSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading conversations">
      <span className="sr-only">Loading conversations...</span>
      <div aria-hidden="true" className="divide-y divide-[#e1e9e4]">{[0, 1, 2, 3, 4].map((item) => <div key={item} className="flex gap-3 p-4 sm:px-5"><SkeletonBlock className="size-10 shrink-0 rounded-full" /><div className="min-w-0 flex-1 space-y-2"><div className="flex justify-between gap-3"><SkeletonBlock className="h-4 w-28 max-w-full" /><SkeletonBlock className="h-5 w-12 shrink-0" /></div><SkeletonBlock className="h-4 w-48 max-w-full" /><SkeletonBlock className="h-3 w-3/4" /><SkeletonBlock className="h-2 w-32 max-w-full" /></div></div>)}</div>
    </div>
  );
}
