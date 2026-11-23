import Reveal from "../ui/Reveal";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import Partners from "../components/Partners";
import PrecisionQA from "../components/PrecisionQA";


const team = [
  {
    name: "Adnan Makahhal",
    avatar: "/Dedicated_Team/Adnan_Pic.jpg",
    description: "Front-end development",
  },
  {
    name: "Dania Jaber",
    initials: "DJ",
    description: "Back-end development",
  },
  {
    name: "Waseem Gber",
    initials: "WG",
    description: "Test case generation",
  },
  {
    name: "Rashed Abualouf",
    initials: "RA",
    description: "Data analysis",
  },
];

function Home() {

  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 text-center sm:px-8 sm:pt-14">
      <Heading as="h1" className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
        Turn Requirements Into
        <br className="hidden sm:block" /> Reliable Test Cases.
      </Heading>
      <Reveal delay={0.08}><P variant="unstyled" className="mx-auto mt-6 max-w-[600px] text-base leading-6 font-medium text-[#526159]">
        Casefy helps QA engineers organize requirements, manage test projects,
        and prepare test requests in shared workspaces.
      </P></Reveal>

      <Reveal delay={0.16} className="mt-8 flex flex-wrap justify-center gap-3.5">
        <Button variant="primary" size="custom"
          to="/signup"
          className="min-h-[52px] min-w-[172px] border border-[#2941372e] px-8 focus-visible:outline-offset-4"
        >
          Start free
        </Button>
        <Button variant="secondary" size="custom"
          to="/how-it-works"
          className="min-h-[52px] min-w-[140px] px-8 font-medium focus-visible:outline-offset-4"
        >
          Learn more
        </Button>
      </Reveal>

      <Reveal as="figure" delay={0.2} className="mx-auto mt-12 max-w-[1040px] text-left sm:mt-14">
        <div className="overflow-hidden rounded-md border border-[#CFDDD5] bg-[#edf3ef] p-2 shadow-[0_16px_48px_-24px_#29413755] sm:p-3">
          <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-3 sm:px-3">
            <div aria-hidden="true" className="flex shrink-0 gap-1.5">
              <Span className="size-2 rounded-full bg-[#91a99a]" />
              <Span className="size-2 rounded-full bg-[#b4c8bc]" />
              <Span className="size-2 rounded-full bg-[#CFDDD5]" />
            </div>
            <Span className="text-[10px] font-semibold tracking-widest text-[#526159] sm:text-xs">
              CASEFY / DASHBOARD
            </Span>
          </div>
          <img
            src="/Hero_Bg/Casefy.png"
            alt="Casefy dashboard after sign-in, showing workspace navigation, testing overview, projects, and recent activity"
            width="1909"
            height="917"
            fetchPriority="high"
            decoding="async"
            className="block h-auto w-full rounded-md border border-[#CFDDD5] bg-white"
          />
        </div>
      </Reveal>

      <Partners />
      <section
        aria-labelledby="team-heading"
        className="mx-auto mt-16 max-w-[1040px] py-8 sm:mt-24"
      >
        <Reveal className="mx-auto max-w-[700px] text-center">
          <H2 variant="unstyled"
            id="team-heading"
            className="mx-auto max-w-[700px] text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl"
          >
            Meet our dedicated team
          </H2>
          <P variant="unstyled" className="mx-auto mt-6 max-w-[600px] text-base leading-6 font-medium text-[#526159]">
            Our team of innovative professionals works tirelessly to deliver
            exceptional experiences and drive successful outcomes for every
            project.
          </P>
        </Reveal>
        <ul
          role="list"
          className="mt-16 grid grid-cols-1 gap-x-4 gap-y-16 text-center sm:grid-cols-2 lg:mt-24 lg:grid-cols-4"
        >
          {team.map((member, index) => (
            <Reveal as="li" delay={index * 0.1}
              key={member.name}




            >
              {member.avatar ? (
                <img
                  className="mx-auto size-24 rounded-full object-cover"
                  src={member.avatar}
                  alt={member.name}
                  width="96"
                  height="96"
                  loading="lazy"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="mx-auto flex size-24 items-center justify-center rounded-full bg-[#edf3ef] text-2xl font-extrabold tracking-tight text-[#294137]"
                >
                  {member.initials}
                </div>
              )}
              <div className="mt-4 flex flex-col">
                <h3 className="text-xl leading-tight font-extrabold tracking-tight text-[#102019]">
                  {member.name}
                </h3>
                <P variant="unstyled" className="mt-2 text-base leading-6 font-medium text-[#526159]">
                  Founder of Casefy
                </P>
                <P variant="unstyled" className="mt-1 text-sm leading-6 font-medium text-[#526159]">
                  {member.description}
                </P>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
      <PrecisionQA />
    </section>
  );
}

export default Home;
