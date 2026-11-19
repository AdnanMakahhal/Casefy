function Placeholder({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-[#e5ece7] motion-reduce:animate-none ${className}`}
    />
  );
}

export default function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64"
    >
      <span className="sr-only">Loading your dashboard...</span>
      <div aria-hidden="true">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#CFDDD5] bg-white p-5 lg:flex">
          <Placeholder className="mx-auto h-[50px] w-[150px]" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Placeholder key={index} className="h-12 w-full" />
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
            <Placeholder className="h-[70px] w-full" />
          </div>
        </aside>
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-3">
              <Placeholder className="size-11 shrink-0 lg:hidden" />
              <div className="min-w-0">
                <Placeholder className="h-10 w-52 max-w-full" />
                <Placeholder className="mt-3 h-6 w-80 max-w-full" />
              </div>
            </div>
            <Placeholder className="h-11 w-48" />
          </div>
          <div className="mt-9">
            <div className="mb-5 flex items-center justify-between gap-2">
              <Placeholder className="h-7 w-40 max-w-full" />
              <Placeholder className="h-12 w-48 shrink-0 sm:w-72" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-md border border-[#CFDDD5] bg-white p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Placeholder className="h-4 w-24" />
                    <Placeholder className="size-9 shrink-0" />
                  </div>
                  <Placeholder className="mt-5 h-9 w-20" />
                  <Placeholder className="mt-2 h-4 w-28" />
                </div>
              ))}
            </div>
            <Placeholder className="mt-4 h-4 w-52 max-w-full" />
          </div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            {[0, 1].map((panel) => (
              <section
                key={panel}
                className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white"
              >
                <div className="border-b border-[#CFDDD5] px-6 py-5">
                  <Placeholder className="h-7 w-36" />
                  <Placeholder className="mt-1 h-5 w-60 max-w-full" />
                </div>
                <div className="space-y-6 px-6 py-8">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex items-center gap-3">
                      <Placeholder className="size-9 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <Placeholder className="h-4 w-32 max-w-full" />
                        <Placeholder className="mt-2 h-3 w-48 max-w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
