import P from "../../ui/P";
import Button from "../../ui/Button";
import { useEffect, useState } from "react";
import AccountModal from "../../components/AccountModal";
import { workspaceRequest } from "./api";

export default function ProjectDetails({ project, onDismiss }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    workspaceRequest(`/projects/${project.id}`).then((data) => {
      if (active) setDetails(data);
    }).catch((error) => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [project.id, attempt]);
  const request = details?.generationRequest;
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(request, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `casefy-project-${project.id}-request.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <AccountModal title="Project details" onDismiss={onDismiss}>
      {error ? <><P variant="unstyled" role="alert" className="text-sm text-red-700">{error}</P><Button variant="unstyled" type="submit" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className="mt-4 min-h-11 rounded-md border border-[#CFDDD5] px-4">Try again</Button></> : !details ? <P variant="unstyled" role="status" className="text-sm">Loading project...</P> : (
        <>
          <h3 className="break-words text-lg font-semibold">{details.name}</h3>
          {details.description && <P variant="unstyled" className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#526159]">{details.description}</P>}
          {request ? (
            <>
              <P variant="unstyled" className="mt-5 rounded-md bg-[#edf3ef] p-3 text-xs leading-5 text-[#526159]">Saved request preview. No AI test cases have been generated. Document contents are not included.</P>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                {[["Source", request.source], ["Generation mode", request.generationMode?.label], ["Test cases", request.filters?.count], ["Priority", request.filters?.priority], ["Test types", request.filters?.testTypes?.join(", ")], ["Output detail", request.configuration?.detail]].map(([label, value]) => <div key={label}><dt className="text-xs text-[#526159]">{label}</dt><dd className="mt-1 break-words font-medium">{value || "—"}</dd></div>)}
              </dl>
              {request.prompt && <div className="mt-5"><h4 className="text-sm font-semibold">Requirements / instructions</h4><P variant="unstyled" className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#526159]">{request.prompt}</P></div>}
              {request.url && <P variant="unstyled" className="mt-4 break-all text-sm">URL: {request.url}</P>}
              {request.documents?.length > 0 && <ul className="mt-4 space-y-2 text-sm">{request.documents.map((file, index) => <li key={index} className="break-words">{file.name}</li>)}</ul>}
              <Button variant="primary" size="custom" type="submit" onClick={download} className="mt-6 min-h-11 px-4">Download saved request</Button>
            </>
          ) : <P variant="unstyled" className="mt-5 text-sm text-[#526159]">This project has no saved generation request.</P>}
        </>
      )}
    </AccountModal>
  );
}
