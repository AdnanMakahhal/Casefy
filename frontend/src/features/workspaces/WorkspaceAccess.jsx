import H2 from "../../ui/H2";
import P from "../../ui/P";
import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { useEffect, useId, useState } from "react";
import {
  RiMailSendLine as Mail,
} from "react-icons/ri";
import Avatar from "../../components/Avatar";
import { workspacePath, workspaceRequest } from "./api";

const roles = [
  {
    value: "viewer",
    label: "Viewer",
    description: "Can view workspace projects",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Can create, edit and delete projects",
  },
];
const button =
  "min-h-10 rounded-md border border-[#CFDDD5] bg-white px-3 text-sm text-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50";

export default function WorkspaceAccess({ workspace }) {
  const id = useId();
  const [data, setData] = useState(null);
  const [revision, setRevision] = useState(0);
  const [role, setRole] = useState("viewer");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    workspaceRequest(workspacePath(workspace.id, "/access"))
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [workspace.id, revision]);

  async function change(path, method, body) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await workspaceRequest(workspacePath(workspace.id, path), {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setMessage(result.message);
      setRevision((value) => value + 1);
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="mt-8 rounded-md border border-[#CFDDD5] bg-white p-5 sm:p-6"
      aria-labelledby="workspace-sharing"
    >
      <H2 variant="unstyled"
        id="workspace-sharing"
        className="text-base font-semibold"
      >
        Team access
      </H2>
      <P variant="unstyled" className="mt-1 text-sm leading-6 text-[#526159]">
        Invite teammates to this private workspace.
      </P>
      <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]" onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        if (await change("/invites", "POST", { role, email: email.trim() })) setEmail("");
      }}>
        <label className="min-w-0">
          <Span className="sr-only">Teammate email</Span>
          <input
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="person@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={busy}
            className="min-h-11 w-full rounded-md border border-[#CFDDD5] px-3 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
          />
        </label>
        <select aria-label="Invite permission" aria-describedby={`${id}-permission`} value={role} onChange={(event) => setRole(event.target.value)} disabled={busy} className={`${button} min-h-11`}>
          {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <Button
          type="submit"
          disabled={busy}
        >
          <Mail size={16} aria-hidden="true" />
          {busy ? "Updating..." : "Send invite"}
        </Button>
      </form>
      <P variant="unstyled" id={`${id}-permission`} className="mt-2 text-xs leading-5 text-[#526159]">
        {role === "viewer" ? "Viewers can view projects." : "Editors can create, edit, and delete projects."} Invites expire in 7 days.
      </P>
      {error && (
        <P variant="unstyled" role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </P>
      )}
      {message && (
        <P variant="unstyled" role="status" className="mt-4 text-sm text-[#294137]">
          {message}
        </P>
      )}
      {!data ? (
        error ? (
          <Button variant="outline" size="sm"
            type="button"
            onClick={() => {
              setError("");
              setRevision((value) => value + 1);
            }}
            className="mt-4"
          >
            Reload members
          </Button>
        ) : (
          <div
            role="status"
            aria-label="Loading members"
            className="mt-5 h-24 animate-pulse rounded-md bg-[#edf3ef]"
          />
        )
      ) : (
        <>
          <h3 className="mt-6 flex items-center gap-2 border-t border-[#e1e9e4] pt-5 text-sm font-semibold">
            Members <Span className="rounded-md bg-[#edf3ef] px-2 py-0.5 text-xs text-[#526159]">{data.members.length + 1}</Span>
          </h3>
          <div className="mt-2 flex items-center gap-3 py-3">
            <Avatar user={data.owner} className="size-9 shrink-0 text-sm" />
            <div className="min-w-0 flex-1">
              <P variant="unstyled" className="break-words text-sm font-medium">{data.owner.name} <Span className="font-normal text-[#718578]">(you)</Span></P>
              <P variant="unstyled" className="mt-0.5 break-all text-xs text-[#526159]">{data.owner.email}</P>
            </div>
            <Span className="rounded-md bg-[#edf3ef] px-2.5 py-1 text-xs font-medium text-[#294137]">
              Owner
            </Span>
          </div>
          {data.members.map((member) => (
            <div
              key={member.userId}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e9e4] py-3"
            >
              <div className="min-w-0">
                <P variant="unstyled" className="break-words text-sm font-medium">{member.user.name}</P>
                <P variant="unstyled" className="break-all text-xs text-[#526159]">
                  {member.user.email}
                </P>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Access for ${member.user.name}`}
                  value={member.role}
                  disabled={busy}
                  onChange={(event) =>
                    change(`/members/${member.userId}`, "PATCH", { role: event.target.value })
                  }
                  className={`${button} w-28`}
                >{roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <Button variant="ghost" size="sm"
                  type="button"
                  disabled={busy}
                  aria-label={`Remove ${member.user.name} from workspace`}
                  onClick={() =>
                    change(`/members/${member.userId}`, "PATCH", {
                      role: "remove",
                    })
                  }
                  className="text-red-700 focus-visible:outline-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          {data.invites.length > 0 && <h3 className="mt-5 border-t border-[#e1e9e4] pt-5 text-sm font-semibold">Pending invites <Span className="ml-1 text-xs font-normal text-[#718578]">{data.invites.length}</Span></h3>}
          {!data.invites.length && (
            <P variant="unstyled" className="mt-3 border-t border-[#e1e9e4] pt-3 text-xs text-[#718578]">
              No pending invitations.
            </P>
          )}
          {data.invites.map((invite) => (
            <div
              key={invite.id}
              className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#f6f8f7] p-3"
            >
              <div>
                <P variant="unstyled" className="text-sm font-medium capitalize">
                  {invite.role} invitation
                </P>
                <P variant="unstyled" className="mt-1 break-all text-sm text-[#294137]">{invite.email || "Legacy invitation (disabled)"}</P>
                <P variant="unstyled" className="mt-1 text-xs text-[#526159]">
                  Expires {new Date(invite.expiresAt).toLocaleString()}
                </P>
              </div>
              <Button variant="ghost" size="sm"
                type="button"
                disabled={busy}
                onClick={() => change(`/invites/${invite.id}`, "DELETE")}
                className="text-red-700 focus-visible:outline-red-700"
              >
                Revoke
              </Button>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
