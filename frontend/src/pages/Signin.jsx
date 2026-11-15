import SigninForm from "../features/authentication/SigninForm";

function Signin() {
  return (
    <section className="min-h-[calc(100svh-78px)] w-full">
      <div className="grid w-full items-center lg:grid-cols-[55%_45%]">
        <div className="mx-auto w-full max-w-lg px-6 py-10 sm:px-8 sm:py-16">
          <h1 className="max-w-md text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Testing clarity starts here.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#526159]">
            Return to your QA workspace, continue test generation, and review the latest automated
            results.
          </p>

          <div className="relative mt-12">
            <div
              aria-hidden="true"
              className="absolute top-10 right-[16.667%] left-[16.667%] h-0.5 bg-[#CFDDD5] sm:top-12"
            />
            <ol aria-label="Testing workflow" className="relative grid grid-cols-3 gap-4">
              <li className="flex flex-col items-center gap-6">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#102018] bg-[#ffffff] text-2xl font-semibold text-[#102018] shadow-[0_4px_20px_#29413726] ring-2 ring-[#102018] ring-offset-2 ring-offset-[#f6f8f7] sm:h-24 sm:w-24">
                  1
                </span>
                <span className="text-xs font-semibold text-[#6c7771] sm:text-sm">ANALYZE</span>
              </li>
              <li className="flex flex-col items-center gap-6">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#102018] bg-[#ffffff] text-2xl font-semibold text-[#102018] sm:h-24 sm:w-24">
                  2
                </span>
                <span className="text-xs font-semibold text-[#6c7771] sm:text-sm">GENERATE</span>
              </li>
              <li className="flex flex-col items-center gap-6">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#102018] bg-[#ffffff] text-2xl font-semibold text-[#102018] sm:h-24 sm:w-24">
                  3
                </span>
                <span className="text-xs font-semibold text-[#6c7771] sm:text-sm">EXECUTE</span>
              </li>
            </ol>
          </div>

          <p className="mt-10 text-base leading-7 text-[#6c7771]">
            A guided flow from requirements to verified results.
          </p>
        </div>

        <div className="min-h-[calc(100svh-78px)] w-full bg-[#FFFFFF] p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-widest text-[#526159]">CASEFY WORKSPACE</p>
          <h2 className="mt-3 text-3xl leading-tight font-semibold">Welcome back</h2>
          <p className="mt-3 text-sm leading-6 text-[#526159]">
            Sign in to continue to your dashboard.
          </p>
          <SigninForm />
        </div>
      </div>
    </section>
  );
}

export default Signin;
