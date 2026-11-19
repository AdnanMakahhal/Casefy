function Placeholder({ className = "", dark = false }) {
  return (
    <span className={`block animate-pulse rounded-md motion-reduce:animate-none ${dark ? "bg-white/15" : "bg-[#e5ece7]"} ${className}`} />
  );
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Placeholder className="h-12" />
      <Placeholder className="h-12" />
    </div>
  );
}

export default function AuthSkeleton({ signup = false }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="w-full bg-[#f6f8f7] p-3 sm:p-5">
      <span className="sr-only">Loading {signup ? "sign up" : "sign in"}...</span>
      <div aria-hidden="true" className="grid min-h-[calc(100svh-118px)] gap-3 lg:grid-cols-[55%_45%] lg:gap-0">
        <div className="flex min-h-[480px] flex-col justify-between rounded-md bg-[#294137] px-7 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div className="pb-12">
            <Placeholder dark className="h-3 w-60 max-w-full" />
            <Placeholder dark className="mt-6 h-10 w-full max-w-sm" />
            <Placeholder dark className="mt-3 h-10 w-4/5 max-w-xs" />
            {signup && <Placeholder dark className="mt-3 h-10 w-3/5" />}
            <div className="mt-7 max-w-sm space-y-3">
              <Placeholder dark className="h-4 w-full" />
              <Placeholder dark className="h-4 w-full" />
              <Placeholder dark className="h-4 w-3/4" />
            </div>
            <Placeholder dark className="mt-8 h-4 w-36" />
          </div>
          <div className="rounded-md border border-white/20 bg-[#102019]/25 p-5 sm:p-6">
            <Placeholder dark className="mx-auto mb-6 h-3 w-56 max-w-full" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <Placeholder dark className="size-14 rounded-full sm:size-16" />
                  <Placeholder dark className="mt-3 h-4 w-16 max-w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center rounded-md border border-[#e1e9e4] bg-white px-6 py-10 sm:px-10 sm:py-12 lg:ml-4 lg:px-10 xl:px-14">
          <div className="mx-auto w-full max-w-md">
            <Placeholder className="h-3 w-48 max-w-full" />
            <Placeholder className="mt-4 h-10 w-72 max-w-full" />
            <Placeholder className="mt-3 h-5 w-80 max-w-full" />
            {signup && <div className="mt-7"><SocialButtons /><Placeholder className="mx-auto my-6 h-3 w-40" /></div>}
            <div className={`${signup ? "" : "mt-7"} space-y-5`}>
              {Array.from({ length: signup ? 3 : 2 }, (_, index) => (
                <div key={index}>
                  <Placeholder className="mb-2 h-4 w-24" />
                  <Placeholder className="h-12 w-full" />
                </div>
              ))}
              {signup && <div className="flex items-center gap-3">
                <Placeholder className="size-5 shrink-0" />
                <Placeholder className="h-4 w-64 max-w-full" />
              </div>}
              <Placeholder className="h-12 w-full" />
            </div>
            {!signup && <><Placeholder className="mx-auto my-8 h-3 w-36" /><SocialButtons /></>}
            <div className="mt-6 flex justify-between gap-3">
              <Placeholder className="h-4 w-32" />
              <Placeholder className="h-4 w-28" />
            </div>
            <Placeholder className="mt-7 h-3 w-72 max-w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
