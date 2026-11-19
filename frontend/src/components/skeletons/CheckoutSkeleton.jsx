import SkeletonBlock from "./SkeletonBlock";

export default function CheckoutSkeleton() {
  return (
    <section
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-6xl px-4 pt-5 pb-8 sm:px-8 sm:pt-6 sm:pb-12"
    >
      <span className="sr-only">Loading checkout...</span>
      <div aria-hidden="true">
        <SkeletonBlock className="size-11 rounded-full" />
        <SkeletonBlock className="mx-auto mt-3 h-12 w-full max-w-xl" />
        <SkeletonBlock className="mx-auto mt-5 h-5 w-full max-w-md" />
        <SkeletonBlock className="mx-auto mt-6 h-10 w-full max-w-lg" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-8">
            <SkeletonBlock className="h-7 w-40" />
            <SkeletonBlock className="mt-4 h-12 w-32" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <SkeletonBlock className="size-4 shrink-0 rounded-full" />
                  <SkeletonBlock className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
            <div className="p-6 sm:p-8">
              <SkeletonBlock className="h-7 w-44" />
              <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
              <SkeletonBlock className="mt-6 h-20 w-full" />
              <div className="mt-6 space-y-5">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="flex justify-between gap-6 border-b border-[#e5ece7] pb-4">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                ))}
              </div>
              <SkeletonBlock className="mt-6 h-14 w-full" />
            </div>
            <SkeletonBlock className="h-14 w-full rounded-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
