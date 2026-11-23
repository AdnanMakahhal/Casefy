import P from "../../ui/P";
import Button from "../../ui/Button";
import { useState } from "react";
import AccountModal from "../../components/AccountModal";
import { workspacePath, workspaceRequest } from "./api";

export default function ProjectForm({
  workspaceId,
  project,
  onDismiss,
  onSaved,
}) {
  const [name, setName] = useState(project?.name || "");
  const [description, setDescription] = useState(project?.description || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const savedProject = await workspaceRequest(
        project
          ? `/projects/${project.id}`
          : workspacePath(workspaceId, "/projects"),
        {
          method: project ? "PATCH" : "POST",
          body: JSON.stringify({ name, description }),
        },
      );
      onSaved(savedProject);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const input =
    "mt-2 w-full rounded-md border border-[#CFDDD5] p-3 focus:outline-[#294137]";
  return (
    <AccountModal
      title={project ? "Edit project" : "New project"}
      onDismiss={onDismiss}
      busy={busy}
    >
      <form onSubmit={submit}>
        <label className="block text-sm font-medium">
          Project name
          <input
            required
            maxLength={100}
            disabled={busy}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={input}
          />
        </label>
        <label className="mt-5 block text-sm font-medium">
          Description
          <textarea
            maxLength={5000}
            rows={4}
            disabled={busy}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={input}
          />
        </label>
        {error && (
          <P variant="unstyled" role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </P>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="unstyled"
            type="button"
            onClick={onDismiss}
            disabled={busy}
            className="min-h-11 rounded-md border border-[#CFDDD5] px-4"
          >
            Cancel
          </Button>
          <Button variant="primary" size="custom" type="submit"
            disabled={busy || !name.trim()}
            className="min-h-11 px-4"
          >
            {busy ? "Saving…" : "Save project"}
          </Button>
        </div>
      </form>
    </AccountModal>
  );
}
