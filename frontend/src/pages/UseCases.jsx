import P from "../ui/P";
import {
  RiBookOpenLine as BookOpen,
  RiCodeSSlashLine as Code2,
  RiGraduationCapLine as GraduationCap,
  RiShoppingCartLine as ShoppingCart,
  RiGroupLine as Users,
  RiGitBranchLine as GitBranch
} from "react-icons/ri";
import MarketingPage from "../ui/MarketingPage";
import MarketingCard from "../ui/MarketingCard";



export default function UseCases() {
  return (
    <MarketingPage
      title="Built for the way you test."
      description="Use Casefy to give your next feature a clearer testing plan, whether you are learning QA, building a product, or preparing a release."
    >
      <div className="grid gap-5 md:grid-cols-2">

        <MarketingCard delay={0.0} icon={BookOpen} title="QA engineers">
          <P variant="unstyled">Break a user story into a coverage plan before writing tests. Include positive paths, invalid input, boundary conditions, and accessibility.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Example: login, password reset, and session expiry.</P>
        </MarketingCard>
        <MarketingCard delay={0.1} icon={Code2} title="Developers">
          <P variant="unstyled">Turn acceptance criteria into a reviewable request before implementation. Make expected behavior and failure paths clear.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Example: search filters, validation, and permissions.</P>
        </MarketingCard>
        <MarketingCard delay={0.0} icon={GraduationCap} title="Students">
          <P variant="unstyled">Practice writing clear requirements and deciding what to test. Compare different priorities and test types without running an AI request.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Example: a course project or a QA assignment.</P>
        </MarketingCard>
        <MarketingCard delay={0.1} icon={Users} title="Teams and employees">
          <P variant="unstyled">Organize projects by workspace and prepare consistent coverage settings for discussion with your team.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Example: an internal tool or a release handoff.</P>
        </MarketingCard>
        <MarketingCard delay={0.0} icon={ShoppingCart} title="Product workflows">
          <P variant="unstyled">Describe important journeys and prepare coverage for the states around them, from a successful action to error recovery.</P>
          <P variant="muted" className="mt-5 border-t border-[#e1e9e4] pt-4">Example: checkout, account updates, and onboarding.</P>
        </MarketingCard>

        <MarketingCard delay={0.1} icon={GitBranch} title="Release automation" planned>
          <P variant="unstyled">
            Run local test suites and connect checks to CI/CD, then use run
            reports to investigate failures. This workflow is planned and is not
            available yet.
          </P>
          <P variant="muted" className="mt-5 border-t border-[#cfddd5] pt-4">
            Planned example: run regression coverage with each pull request.
          </P>
        </MarketingCard>
      </div>


    </MarketingPage>
  );
}
