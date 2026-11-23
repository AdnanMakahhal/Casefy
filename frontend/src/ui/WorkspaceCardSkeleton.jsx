import SkeletonBlock from "./SkeletonBlock";

export default function WorkspaceCardSkeleton() {
  return (
    <div role="status" aria-label="Loading workspaces">
      <span className="sr-only">Loading your workspaces...</span>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <SkeletonBlock className="size-10" />
                <SkeletonBlock className="h-6 w-16" />
              </div>
              <SkeletonBlock className="mt-4 h-5 w-3/4" />
              <SkeletonBlock className="mt-2 h-4 w-28" />
              <SkeletonBlock className="mt-5 h-10 w-36" />
            </div>
            <div className="border-t border-[#e1e9e4] bg-[#f6f8f7] px-5 py-3">
              <SkeletonBlock className="my-2.5 h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
