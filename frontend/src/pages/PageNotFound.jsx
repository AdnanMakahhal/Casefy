import P from "../ui/P";
import Button from "../ui/Button";
import Heading from "../ui/Heading";


function PageNotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-[calc(100svh-78px)] flex-col items-center justify-center bg-[#f6f8f7] px-6 py-16 text-center"
    >
      <P variant="unstyled" className="text-[96px] leading-none font-bold tracking-tight text-[#102019] sm:text-[128px]">
        404
      </P>
      <Heading as="h1"
        id="not-found-title"
        className="mt-6 text-2xl font-semibold text-[#14231c] sm:text-[30px]"
      >
        This page could not be found
      </Heading>
      <P variant="unstyled" className="mt-4 max-w-md text-base leading-6 text-[#6c7771]">
        The link may be outdated, or the page may have moved.
      </P>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="custom"
          to="/"
          className="min-h-12 border border-[#2941372e] px-8 focus-visible:outline-offset-4"
        >
          Back to home
        </Button>
        <Button variant="secondary" size="custom"
          to="/docs"
          className="min-h-12 px-8 focus-visible:outline-offset-4"
        >
          View docs
        </Button>
      </div>
    </section>
  );
}

export default PageNotFound;
