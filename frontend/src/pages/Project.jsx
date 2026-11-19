import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { workspacePath, workspaceRequest } from "../features/workspaces/api";
import TestGenerator from "./TestGenerator";

function ProjectView({ user, workspaceKey, projectId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      workspaceRequest(`/projects/${encodeURIComponent(projectId)}`),
      workspaceRequest(workspacePath(workspaceKey, "/projects")),
    ]).then(([project, { workspace }]) => {
      if (project.workspaceId !== workspace.id) {
        throw new Error("This project has moved. Open it from its current workspace.");
      }
      if (!["owner", "editor"].includes(workspace.role)) {
        throw new Error("You need Editor or Owner access to write tests for this project.");
      }
      if (active) setResult({ project, workspace });
    }).catch((error) => {
      if (active) setError(error.message);
    });
    return () => { active = false; };
  }, [workspaceKey, projectId, attempt]);

  if (result) {
    return <TestGenerator user={user} project={result.project} projectWorkspace={result.workspace} />;
  }

  return (
    <main className="min-h-screen bg-[#f6f8f7] p-6 text-[#102019] sm:p-10">
      <Link to={`/workspaces/${workspaceKey}`} className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-[#294137] underline">
        Back to projects
      </Link>
      {error ? (
        <div className="mt-6 rounded-md border border-[#CFDDD5] bg-white p-6">
          <p role="alert" className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className="mt-4 min-h-11 rounded-md border border-[#CFDDD5] px-4 text-sm font-semibold">Try again</button>
        </div>
      ) : <p role="status" className="mt-6 text-sm">Opening project...</p>}
    </main>
  );
}

export default function Project({ user }) {
  const { workspaceKey, projectId } = useParams();
  return <ProjectView key={`${workspaceKey}:${projectId}`} user={user} workspaceKey={workspaceKey} projectId={projectId} />;
}
