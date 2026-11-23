import H2 from "../ui/H2";
import P from "../ui/P";
import Heading from "../ui/Heading";

export default function Terms() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <header className="mx-auto max-w-[700px] text-center">
        <Heading as="h1" className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">Terms of use</Heading>
        <P variant="lead" className="mx-auto mt-6 max-w-[600px]">The basic expectations for your account, plans, and use of Casefy.</P>
      </header>
      <div className="mx-auto mt-10 max-w-4xl">

        <article className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-9">
          <div className="space-y-8">
            <section aria-labelledby="terms-0">
              <H2 variant="unstyled" id="terms-0" className="text-lg font-bold tracking-tight">1. Using the service</H2>
              <P className="mt-3">By using Casefy, you agree to use it responsibly and follow the usage policy. Provide accurate account details, keep your sign-in credentials private, and use only material and test targets you are authorized to access.</P>
            </section>
            <section aria-labelledby="terms-1">
              <H2 variant="unstyled" id="terms-1" className="text-lg font-bold tracking-tight">2. Your content</H2>
              <P className="mt-3">You are responsible for the requirements, documents, URLs, and other content you provide, including your permission to use or share it. Do not submit confidential or personal information unless it is appropriate and necessary for your work.</P>
            </section>
            <section aria-labelledby="terms-2">
              <H2 variant="unstyled" id="terms-2" className="text-lg font-bold tracking-tight">3. Current functionality and roadmap</H2>
              <P className="mt-3">The current test generator prepares a request for review and download. It does not yet generate or execute tests. Model choices are previews, and selecting a model does not establish a connection to that provider.</P>
              <P className="mt-3">Roadmap items such as AI-generated cases, manual cases, local runners, CI/CD, APIs, and reports are planned features. They are not a guarantee of availability, functionality, or a release date. Assess the service based on the features currently available.</P>
            </section>
            <section aria-labelledby="terms-3">
              <H2 variant="unstyled" id="terms-3" className="text-lg font-bold tracking-tight">4. Plans and payments</H2>
              <P className="mt-3">Review the selected plan, billing interval, price, and renewal information before continuing to Stripe. Monthly and annual subscriptions use the interval chosen at checkout. The annual discount applies to Plus and Pro as shown on the pricing page and checkout summary.</P>
              <P className="mt-3">Paid access is updated after Stripe confirms the subscription's payment status. Leaving Checkout does not itself activate a paid plan. Sandbox transactions use test payment details and are separate from live payments.</P>
              <P className="mt-3">For plan changes, cancellation, billing questions, or refund requests, contact support. Review your subscription's renewal information before purchasing.</P>
            </section>
            <section aria-labelledby="terms-4">
              <H2 variant="unstyled" id="terms-4" className="text-lg font-bold tracking-tight">5. Review testing output</H2>
              <P className="mt-3">You remain responsible for deciding what to test and reviewing any test material before use. When generation and execution are introduced, inspect generated steps, test data, scripts, and target environments before running them. A coverage plan or generated result does not prove that an application is free of defects.</P>
            </section>
            <section aria-labelledby="terms-5">
              <H2 variant="unstyled" id="terms-5" className="text-lg font-bold tracking-tight">6. Account deletion</H2>
              <P className="mt-3">You may delete your account from Profile after confirming your password. The app provides a short Undo window before sending the deletion request. Completed deletion removes associated account, project, and workspace records and cancels active subscriptions. Your primary workspace cannot be deleted separately from the account.</P>
            </section>
            <section aria-labelledby="terms-6">
              <H2 variant="unstyled" id="terms-6" className="text-lg font-bold tracking-tight">7. Changes and questions</H2>
              <P className="mt-3">Casefy is under development, so features, plan options, and these pages may change. Review the information shown before using a new feature or purchasing a subscription. Use the support form if something is unclear or you need help with your account.</P>
            </section>
          </div>

        </article>
      </div>
    </section>
  );
}
