import {
  RiDownloadLine as Download
} from "react-icons/ri";

export default function GenerationResults({ run }) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(run, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `casefy-report-${run.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#102019]">{run.subject}</h3>
          <p className="mt-1 text-xs text-[#526159]">
            {run.testCount} generated cases · {run.model} · Report #{run.id}
          </p>
        </div>
        <button
          type="button"
          onClick={download}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#CFDDD5] px-3 text-sm font-semibold text-[#294137]"
        >
          <Download size={16} />
          Export JSON
        </button>
      </div>
      <p className="rounded-md bg-[#edf3ef] p-3 text-xs leading-5 text-[#526159]">
        These are generated test cases. Review them before use; they have not
        been executed.
      </p>
      {run.error && (
        <p role="alert" className="text-sm text-red-700">
          {run.error}
        </p>
      )}
      <div className="max-h-[60vh] space-y-3 overflow-y-auto">
        {(Array.isArray(run.result) ? run.result : []).map((test, index) => (
          <details
            key={test.id || index}
            className="rounded-md border border-[#CFDDD5] bg-white p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold text-[#102019]">
              {index + 1}. {test.title}
              <span className="ml-2 text-xs font-normal text-[#526159]">
                {test.priority} · {test.type}
              </span>
            </summary>
            <ol className="mt-4 ml-5 list-decimal space-y-2 text-sm leading-6 text-[#526159]">
              {test.steps.map((step, at) => (
                <li key={at}>{step}</li>
              ))}
            </ol>
            <p className="mt-4 border-t border-[#e5ece7] pt-3 text-sm leading-6">
              <strong>Expected result: </strong>
              {test.expectedResult}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
