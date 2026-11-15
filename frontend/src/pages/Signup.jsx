import SignupForm from "../features/authentication/SignupForm";

function Signup() {
  return (
    <section className="min-h-[calc(100svh-78px)] w-full">
      <div className="grid w-full items-center lg:grid-cols-[55%_45%]">
        <div className="mx-auto w-full max-w-lg px-6 py-10 sm:px-8 sm:py-16">
          <h1 className="max-w-md text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Build better tests, faster.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#526159]">
            Create your workspace and turn requirements, user flows, and real
            web pages into organized test coverage.
          </p>

          <div className="mt-8 grid grid-cols-2 rounded-xl border border-[#CFDDD5] bg-[#FFFFFF] p-5 sm:p-6">
            <div className="pr-4 sm:pr-6">
              <p className="text-3xl font-semibold text-[#294137]">94%</p>
              <p className="mt-2 text-sm leading-5 text-[#526159]">
                average pass-rate visibility
              </p>
            </div>
            <div className="border-l border-[#CFDDD5] pl-4 sm:pl-6">
              <p className="text-3xl font-semibold text-[#294137]">3x</p>
              <p className="mt-2 text-sm leading-5 text-[#526159]">
                faster test-case drafting
              </p>
            </div>
          </div>
        </div>
        <div className="min-h-[calc(100svh-78px)] w-full bg-[#FFFFFF] p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-widest text-[#526159]">
            CREATE YOUR WORKSPACE
          </p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold">
            Create account
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#526159]">
            Start organizing automated QA in minutes.
          </p>
          <p className="my-8 text-center text-xs font-medium tracking-wider text-[#526159]">
            OR CREATE WITH
          </p>
          <SignupForm />
        </div>
      </div>
    </section>
  );
}

export default Signup;
