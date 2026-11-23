import H2 from "../ui/H2";
import P from "../ui/P";
import Heading from "../ui/Heading";

export default function Privacy() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <header className="mx-auto max-w-[700px] text-center">
        <Heading as="h1" className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">Privacy at Casefy</Heading>
        <P variant="lead" className="mx-auto mt-6 max-w-[600px]">A simple explanation of what the current app stores, what stays in your browser, and what is planned.</P>
      </header>
      <div className="mx-auto mt-10 max-w-4xl">

        <article className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-9">
          <div className="space-y-8">
            <section aria-labelledby="privacy-0">
              <H2 variant="unstyled" id="privacy-0" className="text-lg font-bold tracking-tight">1. Account and workspace data</H2>
              <P className="mt-3">Casefy stores your name, email, role, password hash, plan, workspace names, and account creation date. If you add a profile photo, the processed avatar image is stored with your profile. Projects store their owner, workspace association, name, description, and creation date.</P>
              <P className="mt-3">This information is used to sign you in, display your profile, organize your workspaces and projects, and apply account access rules. Passwords are stored as hashes rather than plain text.</P>
            </section>
            <section aria-labelledby="privacy-1">
              <H2 variant="unstyled" id="privacy-1" className="text-lg font-bold tracking-tight">2. Generation drafts and documents</H2>
              <P className="mt-3">In the current generator preview, your subject, description, selected files, URL, coverage filters, and model settings stay in the page's browser state. They are not submitted to an AI provider or stored by a generation backend.</P>
              <P className="mt-3">Downloaded JSON requests include the text and settings you entered. Document attachments are represented by file metadata, without document contents. You control where you save or share the downloaded file. Reloading or leaving the page can clear your draft.</P>
            </section>
            <section aria-labelledby="privacy-2">
              <H2 variant="unstyled" id="privacy-2" className="text-lg font-bold tracking-tight">3. Sign-in storage</H2>
              <P className="mt-3">The app uses browser session storage for your authentication token so it can make authenticated requests while you are signed in. Logging out clears the app's stored token. Shared devices should be signed out when you finish.</P>
            </section>
            <section aria-labelledby="privacy-3">
              <H2 variant="unstyled" id="privacy-3" className="text-lg font-bold tracking-tight">4. Payments and third-party services</H2>
              <P className="mt-3">Payment details are entered on Stripe's hosted Checkout page. Casefy stores Stripe customer, subscription, and checkout identifiers, along with subscription status and billing-period information; it does not collect card numbers in its own checkout form.</P>
              <P className="mt-3">Stripe processes payment information under its own privacy notice. External images and linked services may also receive standard browser request information when you load or visit them. During sandbox testing, use test payment details.</P>
            </section>
            <section aria-labelledby="privacy-4">
              <H2 variant="unstyled" id="privacy-4" className="text-lg font-bold tracking-tight">5. Support requests</H2>
              <P className="mt-3">The support form stores the name, email, subject, description, and submission date you provide. Support requests are stored separately from accounts. Deleting your account does not automatically remove a separate support request; contact support about that information.</P>
            </section>
            <section aria-labelledby="privacy-5">
              <H2 variant="unstyled" id="privacy-5" className="text-lg font-bold tracking-tight">6. Your controls and deletion</H2>
              <P className="mt-3">You can edit your profile details, replace or remove your avatar, and request account deletion from Profile. Account deletion removes your account and its associated project and workspace records from the application database and cancels active subscriptions.</P>
              <P className="mt-3">Stripe records are managed separately by Stripe. Deleting a Casefy account does not erase Stripe's records. Contact support with questions about information outside the profile controls.</P>
            </section>
            <section aria-labelledby="privacy-6">
              <H2 variant="unstyled" id="privacy-6" className="text-lg font-bold tracking-tight">7. When AI and integrations arrive</H2>
              <P className="mt-3">AI generation, document parsing, website testing, local execution, and CI/CD are not connected in the current preview. Future integrations may need to process the requirements, files, URLs, or execution data you choose to submit. Check the updated feature information and privacy notice when those features become available.</P>
            </section>
          </div>
          <P variant="unstyled" className="mt-6 text-sm text-[#526159]">Read <a href="https://stripe.com/privacy" target="_blank" rel="noreferrer" className="rounded-md font-medium text-[#294137] underline focus-visible:outline-2 focus-visible:outline-[#294137]">Stripe's privacy notice</a>.</P>

        </article>
      </div>
    </section>
  );
}
