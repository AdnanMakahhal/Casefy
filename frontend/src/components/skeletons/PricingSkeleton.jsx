import SkeletonBlock from "./SkeletonBlock";

export default function PricingSkeleton() {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-20"
    >
      <span className="sr-only">Loading pricing plans...</span>
      <div aria-hidden="true">
        <SkeletonBlock className="mx-auto h-12 w-full max-w-xl" />
        <SkeletonBlock className="mx-auto mt-5 h-5 w-full max-w-md" />
        <SkeletonBlock className="mx-auto mt-8 h-14 w-72 max-w-full rounded-full" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:mt-12 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="rounded-md border border-[#d5e0d9] bg-white p-6 sm:p-7 xl:p-6"
            >
              <SkeletonBlock className="h-7 w-24" />
              <SkeletonBlock className="mt-3 h-4 w-36" />
              <div className="mt-6 space-y-3">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-4/5" />
              </div>
              <SkeletonBlock className="mt-7 h-12 w-32" />
              <SkeletonBlock className="mt-5 h-12 w-full" />
              <div className="mt-7 space-y-4 border-t border-[#e5ece7] pt-6">
                {Array.from({ length: 4 }, (_, feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <SkeletonBlock className="size-4 shrink-0 rounded-full" />
                    <SkeletonBlock className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
