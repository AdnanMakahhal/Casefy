import { Link } from "react-router-dom";

function PageNotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-[calc(100svh-78px)] flex-col items-center justify-center bg-[#f6f8f7] px-6 py-16 text-center"
    >
      <p className="text-[96px] leading-none font-bold tracking-tight text-[#102019] sm:text-[128px]">
        404
      </p>
      <h1
        id="not-found-title"
        className="mt-6 text-2xl font-semibold text-[#14231c] sm:text-[30px]"
      >
        This page could not be found
      </h1>
      <p className="mt-4 max-w-md text-base leading-6 text-[#6c7771]">
        The link may be outdated, or the page may have moved.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#2941372e] bg-[#294137] px-8 text-sm font-semibold text-[#ffffff] transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Back to home
        </Link>
        <Link
          to="/docs"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#CFDDD5] bg-[#edf3ef] px-8 text-sm font-semibold text-[#14231c] transition-colors hover:bg-[#e2ece6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          View docs
        </Link>
      </div>
    </section>
  );
}

export default PageNotFound;
