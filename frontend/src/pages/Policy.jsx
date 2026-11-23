import H2 from "../ui/H2";
import P from "../ui/P";
import Heading from "../ui/Heading";

export default function Policy() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-[#102019] sm:px-8 sm:pt-14 sm:pb-20">
      <header className="mx-auto max-w-[700px] text-center">
        <Heading
          as="h1"
          className="text-4xl leading-[1.12] font-extrabold tracking-tight sm:text-5xl"
        >
          Casefy policy
        </Heading>
        <P variant="lead" className="mx-auto mt-6 max-w-[600px]">
          How to use Casefy responsibly, and what to expect from the current
          preview.
        </P>
      </header>
      <div className="mx-auto mt-10 max-w-4xl">
        <article className="min-w-0 rounded-md border border-[#CFDDD5] bg-white p-6 sm:p-9">
          <div className="space-y-8">
            <section aria-labelledby="policy-0">
              <H2
                variant="unstyled"
                id="policy-0"
                className="text-lg font-bold tracking-tight"
              >
                1. Use Casefy for work you are allowed to test
              </H2>
              <P className="mt-3">
                Use your own requirements, documents, and websites, or material
                you have permission to test. Do not use Casefy to access another
                person's account, bypass access controls, disrupt services, or
                test systems without authorization.
              </P>
            </section>
            <section aria-labelledby="policy-1">
              <H2
                variant="unstyled"
                id="policy-1"
                className="text-lg font-bold tracking-tight"
              >
                2. Keep sensitive information out of your inputs
              </H2>
              <P className="mt-3">
                Do not include passwords, API keys, payment card details, or
                personal information that is not needed for testing. Use sample
                data in stories, documents, and URLs whenever possible.
              </P>
            </section>
            <section aria-labelledby="policy-2">
              <H2
                variant="unstyled"
                id="policy-2"
                className="text-lg font-bold tracking-tight"
              >
                3. Understand the current preview
              </H2>
              <P className="mt-3">
                The test generator currently prepares requests for review and
                JSON download. It does not call AI providers, read uploaded
                document contents, visit URLs, execute tests, or produce run
                reports.
              </P>
              <P className="mt-3">
                Model selection and configuration are preparation tools.
                Selecting a provider does not send your inputs to that provider.
              </P>
            </section>
            <section aria-labelledby="policy-3">
              <H2
                variant="unstyled"
                id="policy-3"
                className="text-lg font-bold tracking-tight"
              >
                4. Workspace and deletion behavior
              </H2>
              <P className="mt-3">
                Your primary workspace is created during signup and cannot be
                deleted on its own. Additional workspaces can be deleted;
                deleting one also deletes its projects. Deleting your account
                removes its associated workspaces and projects.
              </P>
              <P className="mt-3">
                Delete actions include confirmation and a five-second Undo
                window before the deletion request is sent. Once deletion
                completes, it cannot be undone through the app.
              </P>
            </section>
            <section aria-labelledby="policy-4">
              <H2
                variant="unstyled"
                id="policy-4"
                className="text-lg font-bold tracking-tight"
              >
                5. Future features
              </H2>
              <P className="mt-3">
                AI generation, manual test-case editing, local execution, CI/CD,
                public APIs, and reports are planned. They are not available
                until released, and their scope or timing may change.
              </P>
              <P className="mt-3">
                Future test runs will require authorization for the target
                environment. Generated tests will need human review before they
                are used against real systems.
              </P>
            </section>
            <section aria-labelledby="policy-5">
              <H2
                variant="unstyled"
                id="policy-5"
                className="text-lg font-bold tracking-tight"
              >
                6. Report a problem
              </H2>
              <P className="mt-3">
                Use the support form to report an account issue, inappropriate
                use, or a concern about the service. Include only the
                information needed to explain the problem.
              </P>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
