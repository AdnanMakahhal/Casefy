import { Link, NavLink } from "react-router-dom";

const pages = {
  policy: {
    title: "Casefy policy",
    description:
      "How to use Casefy responsibly, and what to expect from the current preview.",
    sections: [
      {
        title: "Use Casefy for work you are allowed to test",
        paragraphs: [
          "Use your own requirements, documents, and websites, or material you have permission to test. Do not use Casefy to access another person's account, bypass access controls, disrupt services, or test systems without authorization.",
        ],
      },
      {
        title: "Keep sensitive information out of your inputs",
        paragraphs: [
          "Do not include passwords, API keys, payment card details, or personal information that is not needed for testing. Use sample data in stories, documents, and URLs whenever possible.",
        ],
      },
      {
        title: "Understand the current preview",
        paragraphs: [
          "The test generator currently prepares requests for review and JSON download. It does not call AI providers, read uploaded document contents, visit URLs, execute tests, or produce run reports.",
          "Model selection and configuration are preparation tools. Selecting a provider does not send your inputs to that provider.",
        ],
      },
      {
        title: "Workspace and deletion behavior",
        paragraphs: [
          "Your primary workspace is created during signup and cannot be deleted on its own. Additional workspaces can be deleted; deleting one also deletes its projects. Deleting your account removes its associated workspaces and projects.",
          "Delete actions include confirmation and a five-second Undo window before the deletion request is sent. Once deletion completes, it cannot be undone through the app.",
        ],
      },
      {
        title: "Future features",
        paragraphs: [
          "AI generation, manual test-case editing, local execution, CI/CD, public APIs, and reports are planned. They are not available until released, and their scope or timing may change.",
          "Future test runs will require authorization for the target environment. Generated tests will need human review before they are used against real systems.",
        ],
      },
      {
        title: "Report a problem",
        paragraphs: [
          "Use the support form to report an account issue, inappropriate use, or a concern about the service. Include only the information needed to explain the problem.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy at Casefy",
    description:
      "A simple explanation of what the current app stores, what stays in your browser, and what is planned.",
    sections: [
      {
        title: "Account and workspace data",
        paragraphs: [
          "Casefy stores your name, email, role, password hash, plan, workspace names, and account creation date. If you add a profile photo, the processed avatar image is stored with your profile. Projects store their owner, workspace association, name, description, and creation date.",
          "This information is used to sign you in, display your profile, organize your workspaces and projects, and apply account access rules. Passwords are stored as hashes rather than plain text.",
        ],
      },
      {
        title: "Generation drafts and documents",
        paragraphs: [
          "In the current generator preview, your subject, description, selected files, URL, coverage filters, and model settings stay in the page's browser state. They are not submitted to an AI provider or stored by a generation backend.",
          "Downloaded JSON requests include the text and settings you entered. Document attachments are represented by file metadata, without document contents. You control where you save or share the downloaded file. Reloading or leaving the page can clear your draft.",
        ],
      },
      {
        title: "Sign-in storage",
        paragraphs: [
          "The app uses browser session storage for your authentication token so it can make authenticated requests while you are signed in. Logging out clears the app's stored token. Shared devices should be signed out when you finish.",
        ],
      },
      {
        title: "Payments and third-party services",
        paragraphs: [
          "Payment details are entered on Stripe's hosted Checkout page. Casefy stores Stripe customer, subscription, and checkout identifiers, along with subscription status and billing-period information; it does not collect card numbers in its own checkout form.",
          "Stripe processes payment information under its own privacy notice. External images and linked services may also receive standard browser request information when you load or visit them. During sandbox testing, use test payment details.",
        ],
      },
      {
        title: "Support requests",
        paragraphs: [
          "The support form stores the name, email, subject, description, and submission date you provide. Support requests are stored separately from accounts. Deleting your account does not automatically remove a separate support request; contact support about that information.",
        ],
      },
      {
        title: "Your controls and deletion",
        paragraphs: [
          "You can edit your profile details, replace or remove your avatar, and request account deletion from Profile. Account deletion removes your account and its associated project and workspace records from the application database and cancels active subscriptions.",
          "Stripe records are managed separately by Stripe. Deleting a Casefy account does not erase Stripe's records. Contact support with questions about information outside the profile controls.",
        ],
      },
      {
        title: "When AI and integrations arrive",
        paragraphs: [
          "AI generation, document parsing, website testing, local execution, and CI/CD are not connected in the current preview. Future integrations may need to process the requirements, files, URLs, or execution data you choose to submit. Check the updated feature information and privacy notice when those features become available.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of use",
    description:
      "The basic expectations for your account, plans, and use of Casefy.",
    sections: [
      {
        title: "Using the service",
        paragraphs: [
          "By using Casefy, you agree to use it responsibly and follow the usage policy. Provide accurate account details, keep your sign-in credentials private, and use only material and test targets you are authorized to access.",
        ],
      },
      {
        title: "Your content",
        paragraphs: [
          "You are responsible for the requirements, documents, URLs, and other content you provide, including your permission to use or share it. Do not submit confidential or personal information unless it is appropriate and necessary for your work.",
        ],
      },
      {
        title: "Current functionality and roadmap",
        paragraphs: [
          "The current test generator prepares a request for review and download. It does not yet generate or execute tests. Model choices are previews, and selecting a model does not establish a connection to that provider.",
          "Roadmap items such as AI-generated cases, manual cases, local runners, CI/CD, APIs, and reports are planned features. They are not a guarantee of availability, functionality, or a release date. Assess the service based on the features currently available.",
        ],
      },
      {
        title: "Plans and payments",
        paragraphs: [
          "Review the selected plan, billing interval, price, and renewal information before continuing to Stripe. Monthly and annual subscriptions use the interval chosen at checkout. The annual discount applies to Plus and Pro as shown on the pricing page and checkout summary.",
          "Paid access is updated after Stripe confirms the subscription's payment status. Leaving Checkout does not itself activate a paid plan. Sandbox transactions use test payment details and are separate from live payments.",
          "For plan changes, cancellation, billing questions, or refund requests, contact support. Review your subscription's renewal information before purchasing.",
        ],
      },
      {
        title: "Review testing output",
        paragraphs: [
          "You remain responsible for deciding what to test and reviewing any test material before use. When generation and execution are introduced, inspect generated steps, test data, scripts, and target environments before running them. A coverage plan or generated result does not prove that an application is free of defects.",
        ],
      },
      {
        title: "Account deletion",
        paragraphs: [
          "You may delete your account from Profile after confirming your password. The app provides a short Undo window before sending the deletion request. Completed deletion removes associated account, project, and workspace records and cancels active subscriptions. Your primary workspace cannot be deleted separately from the account.",
        ],
      },
      {
        title: "Changes and questions",
        paragraphs: [
          "Casefy is under development, so features, plan options, and these pages may change. Review the information shown before using a new feature or purchasing a subscription. Use the support form if something is unclear or you need help with your account.",
        ],
      },
    ],
  },
};

export default function LegalPage({ kind }) {
  const page = pages[kind];
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <header className="mx-auto max-w-[700px] text-center">
        <h1 className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl">
          {page.title}
        </h1>
        <p className="mx-auto mt-6 max-w-[600px] text-base leading-7 font-medium text-[#526159]">
          {page.description}
        </p>
        <p className="mt-4 text-xs text-[#718578]">Updated November 14, 2026</p>
      </header>
      <div className="mx-auto mt-10 grid max-w-[1040px] items-start gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav
          aria-label="Policy pages"
          className="flex flex-wrap gap-2 rounded-xl border border-[#CFDDD5] bg-white p-2 lg:sticky lg:top-28 lg:flex-col"
        >
          {[
            ["policy", "Policy"],
            ["privacy", "Privacy"],
            ["terms", "Terms"],
          ].map(([key, label]) => (
            <NavLink
              key={key}
              to={`/${key}`}
              className={({ isActive }) =>
                `inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#294137] ${isActive ? "bg-[#edf3ef] text-[#294137]" : "text-[#718578] hover:bg-[#f6f8f7]"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <article className="min-w-0 rounded-2xl border border-[#CFDDD5] bg-white p-6 sm:p-9">
          <div className="space-y-8">
            {page.sections.map((section, index) => (
              <section key={section.title} aria-labelledby={`${kind}-${index}`}>
                <h2
                  id={`${kind}-${index}`}
                  className="text-lg font-bold tracking-tight"
                >
                  {index + 1}. {section.title}
                </h2>
                {section.paragraphs.map((text) => (
                  <p
                    key={text}
                    className="mt-3 text-sm leading-7 text-[#526159]"
                  >
                    {text}
                  </p>
                ))}
              </section>
            ))}
          </div>
          {kind === "privacy" && (
            <p className="mt-6 text-sm text-[#526159]">
              Read{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="rounded font-medium text-[#294137] underline focus-visible:outline-2 focus-visible:outline-[#294137]"
              >
                Stripe's privacy notice
              </a>
              .
            </p>
          )}
          <div className="mt-9 border-t border-[#e1e9e4] pt-6">
            <h2 className="text-lg font-bold">Need help?</h2>
            <p className="mt-2 text-sm leading-7 text-[#526159]">
              Contact us about your account, data, or the service.
            </p>
            <Link
              to="/support"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-[#294137] px-5 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
            >
              Contact support
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
