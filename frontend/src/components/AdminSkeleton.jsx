function Placeholder({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-[#e5ece7] motion-reduce:animate-none ${className}`}
    />
  );
}

function PanelHeading() {
  return (
    <div className="border-b border-[#CFDDD5] px-6 py-5">
      <Placeholder className="h-5 w-32" />
      <Placeholder className="mt-2 h-4 w-48 max-w-full" />
    </div>
  );
}

function Content({ view }) {
  if (view === "users")
    return (
      <section className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
        <PanelHeading />
        <div className="flex flex-wrap gap-3 border-b border-[#CFDDD5] px-6 py-5">
          <Placeholder className="h-11 min-w-40 flex-1" />
          <Placeholder className="h-11 w-28" />
          <Placeholder className="h-11 w-28" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6 bg-[#edf3ef] px-6 py-3">
              {Array.from({ length: 5 }, (_, index) => (
                <Placeholder key={index} className="h-3 w-16" />
              ))}
            </div>
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-6 border-t border-[#e5ece7] px-6 py-5"
              >
                <div className="flex items-center gap-3">
                  <Placeholder className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <Placeholder className="h-4 w-24" />
                    <Placeholder className="mt-2 h-3 w-36 max-w-full" />
                  </div>
                </div>
                <Placeholder className="h-6 w-20" />
                <Placeholder className="h-4 w-16" />
                <Placeholder className="h-4 w-10" />
                <Placeholder className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between border-t border-[#CFDDD5] px-6 py-5">
          <Placeholder className="h-4 w-24" />
          <Placeholder className="h-4 w-28" />
        </div>
      </section>
    );

  if (view !== "overview")
    return (
      <section className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#CFDDD5] p-5 sm:flex-row">
          <Placeholder className="h-11 min-w-0 flex-1" />
          <Placeholder className="h-11 w-full sm:w-48" />
        </div>
        <PanelHeading />
        <div className="divide-y divide-[#e5ece7]">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-5">
              <Placeholder className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Placeholder className="h-4 w-40 max-w-full" />
                <Placeholder className="mt-2 h-3 w-64 max-w-full" />
              </div>
              <Placeholder className="hidden h-6 w-20 sm:block" />
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <>
      <div className="mb-5 flex min-h-10 items-center justify-between gap-4">
        <Placeholder className="h-6 w-52" />
        <Placeholder className="h-4 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-md border border-[#CFDDD5] bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <Placeholder className="h-4 w-24" />
              <Placeholder className="size-9 rounded-md" />
            </div>
            <Placeholder className="mt-5 h-9 w-20" />
            <Placeholder className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <PanelHeading />
          <div className="px-6">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-[#e5ece7] py-5 last:border-0"
              >
                <Placeholder className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Placeholder className="h-4 w-28" />
                  <Placeholder className="mt-2 h-3 w-40 max-w-full" />
                </div>
                <Placeholder className="h-4 w-14" />
              </div>
            ))}
          </div>
        </section>
        <section className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <PanelHeading />
          <div className="space-y-7 p-6">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index}>
                <div className="mb-3 flex justify-between">
                  <Placeholder className="h-4 w-20" />
                  <Placeholder className="h-4 w-6" />
                </div>
                <Placeholder className="h-2 w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default function AdminSkeleton({ view = "overview", fullPage = false }) {
  const content = <Content view={view} />;
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={
        fullPage
          ? "min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64"
          : undefined
      }
    >
      <span className="sr-only">
        Loading {view === "users" ? "users" : "admin dashboard"}...
      </span>
      <div aria-hidden="true">
        {fullPage ? (
          <>
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#CFDDD5] bg-white p-5 lg:flex">
              <Placeholder className="mx-auto h-[50px] w-[150px]" />
              <div className="mt-6 space-y-2">
                <Placeholder className="h-12 w-full rounded-md" />
                <Placeholder className="h-12 w-full rounded-md" />
              </div>
              <Placeholder className="mt-auto h-[70px] w-full rounded-md" />
            </aside>
            <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
              <div className="mb-9 flex flex-wrap justify-between gap-5">
                <div>
                  <Placeholder className="h-10 w-64 max-w-full" />
                  <Placeholder className="mt-3 h-5 w-80 max-w-full" />
                </div>
                <Placeholder className="h-11 w-32 rounded-md" />
              </div>
              {content}
            </main>
          </>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
