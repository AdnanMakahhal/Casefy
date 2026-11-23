import Span from "./Span";
import Reveal from "./Reveal";

export default function MarketingCard({
  icon: Icon,
  title,
  children,
  planned = false,
  delay = 0,
}) {
  return (
    <Reveal
      as="article"
      delay={delay}
      className={`min-w-0 rounded-md border p-6 sm:p-8 ${planned ? "border-[#dce6df] bg-[#edf3ef]" : "border-[#CFDDD5] bg-white"}`}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <Span
          className={`flex size-12 items-center justify-center rounded-md ${planned ? "bg-white text-[#294137]" : "bg-[#294137] text-white"}`}
        >
          <Icon size={22} aria-hidden="true" />
        </Span>
        {planned && (
          <Span variant="muted" className="rounded-md border border-[#cfddd5] bg-white px-3 py-1 text-[10px] font-semibold">
            Planned
          </Span>
        )}
      </div>
      <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
      <div className="mt-3 text-sm leading-7 text-[#526159]">{children}</div>
    </Reveal>
  );
}
