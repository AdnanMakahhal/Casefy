import BrandLogo from "./BrandLogo";

function Placeholder({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-[#e5ece7] motion-reduce:animate-none ${className}`}
    />
  );
}

export default function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64"
    >
      <span className="sr-only">Loading your profile...</span>
      <div aria-hidden="true">
        <div className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#CFDDD5] bg-white p-5 lg:flex">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-12 items-center gap-3 px-3"
              >
                <Placeholder className="size-5 shrink-0" />
                <Placeholder className="h-4 w-28" />
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-3">
            <div className="rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-3">
              <div className="flex justify-between gap-3">
                <Placeholder className="h-3 w-24" />
                <Placeholder className="h-3 w-14" />
              </div>
              <Placeholder className="mt-3 h-7 w-28" />
              <Placeholder className="mt-3 h-1.5 w-full rounded-full" />
            </div>
            <div className="flex items-center gap-3 rounded-md border border-[#CFDDD5] p-3">
              <Placeholder className="size-9 shrink-0 rounded-full" />
              <div>
                <Placeholder className="h-4 w-28" />
                <Placeholder className="mt-2 h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
          <div className="flex items-start gap-3">
            <Placeholder className="size-11 shrink-0 rounded-md lg:hidden" />
            <div className="min-w-0 flex-1">
              <Placeholder className="h-9 w-32 sm:h-10" />
              <Placeholder className="mt-3 h-6 w-80 max-w-full" />
            </div>
          </div>
          <div className="mt-9 max-w-3xl overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
            <div className="flex items-center gap-5 border-b border-[#CFDDD5] px-6 py-6 sm:px-8">
              <Placeholder className="size-20 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Placeholder className="h-7 w-44 max-w-full" />
                <Placeholder className="mt-2 h-5 w-24" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#CFDDD5] bg-[#f6f8f7] px-6 py-4 sm:px-8">
              <div>
                <Placeholder className="h-5 w-24" />
                <Placeholder className="mt-2 h-7 w-20 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Placeholder className="h-11 w-32 rounded-md" />
                <Placeholder className="h-11 w-28 rounded-md" />
              </div>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index}>
                  <Placeholder className="h-5 w-28" />
                  <Placeholder className="mt-2 h-6 w-44 max-w-full" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-between gap-3 border-t border-[#CFDDD5] px-6 py-5 sm:px-8">
              <div className="flex flex-wrap gap-3">
                <Placeholder className="h-11 w-32 rounded-md" />
                <Placeholder className="h-11 w-36 rounded-md" />
              </div>
              <Placeholder className="h-11 w-36 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
