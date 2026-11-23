import P from "./P";
import Heading from "./Heading";
import Reveal from "./Reveal";


export default function MarketingPage({ title, description, children }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <header className="mx-auto max-w-[700px] text-center">
        <Heading as="h1" className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
          {title}
        </Heading>
        <Reveal delay={0.08}>
          <P variant="lead" className="mx-auto mt-6 max-w-[600px]">
            {description}
          </P>
        </Reveal>
      </header>
      <div className="mx-auto mt-12 max-w-[1040px] space-y-12 sm:space-y-16">
        {children}
      </div>
    </section>
  );
}
