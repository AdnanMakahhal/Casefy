import SkeletonBlock from "./SkeletonBlock";
import Span from "./Span";

function PanelHeading({ compact = false }) {
  return (
    <div className={compact ? "border-b border-[#e1e9e4] px-4 py-4 sm:px-5" : "border-b border-[#CFDDD5] px-6 py-5"}>
      <SkeletonBlock className={compact ? "h-6 w-36 max-w-full" : "h-5 w-32 max-w-full"} />
      <SkeletonBlock className={compact ? "mt-1 h-5 w-44 max-w-full" : "mt-2 h-4 w-48 max-w-full"} />
    </div>
  );
}

function Content({ view }) {
  if (view === "users")
    return (
      <section className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
        <PanelHeading />
        <div className="flex flex-wrap gap-3 border-b border-[#CFDDD5] px-6 py-5">
          <SkeletonBlock className="h-11 min-w-40 flex-1" />
          <SkeletonBlock className="h-11 w-28" />
          <SkeletonBlock className="h-11 w-28" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6 bg-[#edf3ef] px-6 py-3">
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonBlock key={index} className="h-3 w-16" />
              ))}
            </div>
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-6 border-t border-[#e5ece7] px-6 py-5"
              >
                <div className="flex items-center gap-3">
                  <SkeletonBlock className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="mt-2 h-3 w-36 max-w-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-6 w-20" />
                <SkeletonBlock className="h-4 w-16" />
                <SkeletonBlock className="h-4 w-10" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between border-t border-[#CFDDD5] px-6 py-5">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
      </section>
    );

  if (view !== "overview")
    return (
      <section className="overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#CFDDD5] p-5 sm:flex-row">
          <SkeletonBlock className="h-11 min-w-0 flex-1" />
          <SkeletonBlock className="h-11 w-full sm:w-48" />
        </div>
        <PanelHeading />
        <div className="divide-y divide-[#e5ece7]">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-5">
              <SkeletonBlock className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-40 max-w-full" />
                <SkeletonBlock className="mt-2 h-3 w-64 max-w-full" />
              </div>
              <SkeletonBlock className="hidden h-6 w-20 sm:block" />
            </div>
          ))}
        </div>
      </section>
    );

  return (
    <>
      <div className="mb-5 flex min-h-10 flex-wrap items-center justify-between gap-3">
        <SkeletonBlock className="h-6 w-52 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <SkeletonBlock className="h-4 w-24 max-w-full" />
              <SkeletonBlock className="size-9 shrink-0" />
            </div>
            <SkeletonBlock className="mt-5 h-9 w-20" />
            <SkeletonBlock className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <PanelHeading compact />
          <div className="divide-y divide-[#e1e9e4]">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-20 items-center gap-3 px-4 py-4 sm:px-5"
              >
                <SkeletonBlock className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <SkeletonBlock className="h-5 w-28 max-w-full" />
                  <SkeletonBlock className="mt-1 h-4 w-40 max-w-full" />
                </div>
                <SkeletonBlock className="h-6 w-12 shrink-0" />
              </div>
            ))}
          </div>
        </section>
        <section className="min-w-0 overflow-hidden rounded-md border border-[#CFDDD5] bg-white">
          <PanelHeading compact />
          <div className="space-y-1 p-3 sm:p-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="px-2 py-3">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-6 w-12" />
                  <SkeletonBlock className="h-5 w-9" />
                </div>
                <SkeletonBlock className="h-1.5 w-full" />
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
      <Span className="sr-only">
        Loading {view === "users" ? "users" : "admin dashboard"}...
      </Span>
      <div aria-hidden="true">
        {fullPage ? (
          <>
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#CFDDD5] bg-white p-5 lg:flex">
              <SkeletonBlock className="mx-auto h-[50px] w-[150px]" />
              <div className="mt-6 space-y-2">
                {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className="h-12 w-full" />)}
              </div>
              <SkeletonBlock className="mt-auto h-[70px] w-full rounded-md" />
            </aside>
            <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:p-10">
              <div className="mb-9 flex flex-wrap justify-between gap-5">
                <div>
                  <SkeletonBlock className="h-10 w-64 max-w-full" />
                  <SkeletonBlock className="mt-3 h-5 w-80 max-w-full" />
                </div>
                <SkeletonBlock className="h-11 w-32 rounded-md" />
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
