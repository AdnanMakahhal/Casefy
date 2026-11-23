import SkeletonBlock from "./SkeletonBlock";

export default function AdminTableSkeleton({ label = "Loading subscriptions", columns = 5 }) {
  const grid = columns === 6 ? "grid grid-cols-6 gap-5" : "grid grid-cols-5 gap-5";
  return (
    <div role="status" aria-label={label} aria-busy="true" className="overflow-x-auto">
      <span className="sr-only">{label}...</span>
      <div aria-hidden="true" className="min-w-[760px]">
        <div className={`${grid} border-b border-[#e1e9e4] bg-[#f6f8f7] px-5 py-4`}>{Array.from({ length: columns }, (_, index) => <SkeletonBlock key={index} className="h-3 w-20 max-w-full" />)}</div>
        {[0, 1, 2, 3, 4].map((row) => <div key={row} className={`${grid} items-center border-b border-[#e1e9e4] px-5 py-5 last:border-0`}>
          <div className="min-w-0 space-y-2"><SkeletonBlock className="h-4 w-28 max-w-full" /><SkeletonBlock className="h-3 w-full" /></div>
          {Array.from({ length: columns - 2 }, (_, index) => <div key={index} className="min-w-0 space-y-2"><SkeletonBlock className="h-5 w-20 max-w-full" /><SkeletonBlock className="h-3 w-16 max-w-full" /></div>)}
          <SkeletonBlock className="h-9 w-24 max-w-full" />
        </div>)}
        <div className="flex justify-between border-t border-[#e1e9e4] px-5 py-4"><SkeletonBlock className="h-4 w-32" /><SkeletonBlock className="h-8 w-24" /></div>
      </div>
    </div>
  );
}
