import {
  RiBookOpenLine as BookOpen,
  RiCodeSSlashLine as Code2,
  RiGraduationCapLine as GraduationCap,
  RiShoppingCartLine as ShoppingCart,
  RiGroupLine as Users,
  RiGitBranchLine as GitBranch
} from "react-icons/ri";
import MarketingPage, {
  MarketingCard,
  MarketingCta,
} from "../components/marketing/MarketingPage";

const cases = [
  {
    icon: BookOpen,
    title: "QA engineers",
    text: "Break a user story into a coverage plan before writing tests. Include positive paths, invalid input, boundary conditions, and accessibility.",
    example: "Example: login, password reset, and session expiry.",
  },
  {
    icon: Code2,
    title: "Developers",
    text: "Turn acceptance criteria into a reviewable request before implementation. Make expected behavior and failure paths clear.",
    example: "Example: search filters, validation, and permissions.",
  },
  {
    icon: GraduationCap,
    title: "Students",
    text: "Practice writing clear requirements and deciding what to test. Compare different priorities and test types without running an AI request.",
    example: "Example: a course project or a QA assignment.",
  },
  {
    icon: Users,
    title: "Teams and employees",
    text: "Organize projects by workspace and prepare consistent coverage settings for discussion with your team.",
    example: "Example: an internal tool or a release handoff.",
  },
  {
    icon: ShoppingCart,
    title: "Product workflows",
    text: "Describe important journeys and prepare coverage for the states around them, from a successful action to error recovery.",
    example: "Example: checkout, account updates, and onboarding.",
  },
];

export default function UseCases() {
  return (
    <MarketingPage
      title={
        <>
          Built for the way
          <br />
          <span className="text-[#294137]">you test.</span>
        </>
      }
      description="Use Casefy to give your next feature a clearer testing plan, whether you are learning QA, building a product, or preparing a release."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {cases.map(({ icon, title, text, example }) => (
          <MarketingCard key={title} icon={icon} title={title}>
            <p>{text}</p>
            <p className="mt-5 border-t border-[#e1e9e4] pt-4 text-xs leading-6 text-[#718578]">
              {example}
            </p>
          </MarketingCard>
        ))}
        <MarketingCard icon={GitBranch} title="Release automation" planned>
          <p>
            Run local test suites and connect checks to CI/CD, then use run
            reports to investigate failures. This workflow is planned and is not
            available yet.
          </p>
          <p className="mt-5 border-t border-[#cfddd5] pt-4 text-xs leading-6 text-[#718578]">
            Planned example: run regression coverage with each pull request.
          </p>
        </MarketingCard>
      </div>
      <p className="rounded-md border border-[#CFDDD5] bg-white p-5 text-sm leading-7 text-[#526159]">
        The current generator prepares requests for review and download.
        AI-generated cases, manual case editing, local execution, and CI/CD will
        be added in future stages.
      </p>
      <MarketingCta title="Give your next feature a testing plan." />
    </MarketingPage>
  );
}
