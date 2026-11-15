import { Link } from "react-router-dom";

export default function MarketingPage({ title, description, children }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <header className="mx-auto max-w-[700px] text-center">
        <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-6 max-w-[600px] text-base leading-7 font-medium text-[#526159]">
          {description}
        </p>
      </header>
      <div className="mx-auto mt-12 max-w-[1040px] space-y-12 sm:space-y-16">
        {children}
      </div>
    </section>
  );
}

export function MarketingCard({
  icon: Icon,
  title,
  children,
  planned = false,
}) {
  return (
    <article
      className={`min-w-0 rounded-2xl border p-6 sm:p-8 ${planned ? "border-[#dce6df] bg-[#edf3ef]" : "border-[#CFDDD5] bg-white"}`}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <span
          className={`flex size-12 items-center justify-center rounded-xl ${planned ? "bg-white text-[#294137]" : "bg-[#294137] text-white"}`}
        >
          <Icon size={22} aria-hidden="true" />
        </span>
        {planned && (
          <span className="rounded-full border border-[#cfddd5] bg-white px-3 py-1 text-[10px] font-semibold text-[#718578]">
            Planned
          </span>
        )}
      </div>
      <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
      <div className="mt-3 text-sm leading-7 text-[#526159]">{children}</div>
    </article>
  );
}

export function MarketingCta({
  title = "Start with your next user story.",
  description = "Prepare your requirements and shape the coverage that fits your workflow.",
}) {
  return (
    <section className="rounded-2xl border border-[#CFDDD5] bg-[#edf3ef] px-6 py-10 text-center sm:px-10 sm:py-12">
      <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#526159]">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/test-generator"
          className="inline-flex min-h-[52px] items-center justify-center rounded-md border border-[#2941372e] bg-[#294137] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Open test generator
        </Link>
        <Link
          to="/docs"
          className="inline-flex min-h-[52px] items-center justify-center rounded-md border border-[#CFDDD5] bg-white px-6 text-sm font-semibold text-[#294137] hover:bg-[#e2ece6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Read the docs
        </Link>
      </div>
    </section>
  );
}
