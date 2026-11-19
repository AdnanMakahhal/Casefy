import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountModal from "../../components/AccountModal";
import useWorkspaces from "./useWorkspaces";
import { workspaceRequest } from "./api";

export default function MoveProjectModal({ project, workspaceId, onDismiss }) {
  const { workspaces, loading, error: loadError } = useWorkspaces();
  const destinations = workspaces.filter((workspace) => workspace.id !== workspaceId && ["owner", "editor"].includes(workspace.role));
  const [selected, setSelected] = useState("");
  const destination = destinations.find((workspace) => workspace.id === selected) || destinations[0];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    if (busy || !destination) return;
    setBusy(true);
    setError("");
    try {
      const moved = await workspaceRequest(`/projects/${project.id}/move`, {
        method: "POST",
        body: JSON.stringify({ workspaceKey: destination.key }),
      });
      navigate(`/workspaces/${moved.workspaceId}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountModal title="Move project" onDismiss={onDismiss} busy={busy}>
      <p className="mb-5 break-words text-sm leading-6 text-[#526159]">Move “{project.name}” and its saved request to another workspace. Members of the destination workspace will have access, and its owner will own the project.</p>
      {loading ? <p role="status" className="text-sm">Loading workspaces...</p> : loadError ? <p role="alert" className="text-sm text-red-700">{loadError}</p> : !destinations.length ? <p role="status" className="text-sm text-[#526159]">No other workspaces are available. You need Owner or Editor access in the destination workspace. Accept an Editor invitation or create another workspace to move this project.</p> : (
        <form onSubmit={submit}>
          <label className="block text-sm font-medium">
            Destination workspace
            <select value={destination?.id || ""} onChange={(event) => setSelected(event.target.value)} disabled={busy} className="mt-2 min-h-12 w-full rounded-md border border-[#CFDDD5] bg-white p-3 text-sm focus:outline-[#294137]">
              {destinations.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} ({workspace.role})</option>)}
            </select>
          </label>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onDismiss} disabled={busy} className="min-h-11 rounded-md border border-[#CFDDD5] px-4">Cancel</button>
            <button disabled={busy || !destination} className="min-h-11 rounded-md bg-[#294137] px-4 text-white disabled:opacity-50">{busy ? "Moving..." : "Move project"}</button>
          </div>
        </form>
      )}
    </AccountModal>
  );
}
