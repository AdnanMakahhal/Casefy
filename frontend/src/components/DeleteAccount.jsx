import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountModal from "./AccountModal";
import { useAuth } from "../features/authentication/authContext";
import { useUndoDeletion } from "../context/undoDeletionContext";
import HoldToConfirmButton from "./HoldToConfirmButton";

export default function DeleteAccount({ onDismiss }) {
  const { deleteAccount } = useAuth();
  const { scheduleDeletion, deletionBusy } = useUndoDeletion();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  function remove() {
    if (!password || deletionBusy) return;
    if (
      scheduleDeletion({
        id: "account",
        message: "Account deletion scheduled",
        commit: async () => {
          await deleteAccount(password);
          navigate("/signup", { replace: true });
        },
      })
    )
      onDismiss();
  }
  return (
    <AccountModal title="Delete your account?" onDismiss={onDismiss}>
      <p className="text-sm leading-6 text-[#526159]">
        This deletes your account, profile photo, projects, and all workspace
        details, including your primary workspace. Active subscriptions will be
        canceled. Hold to confirm, then use Undo within 5 seconds to keep your
        account. After that, deletion is permanent.
      </p>
      <form onSubmit={(event) => event.preventDefault()} className="mt-5">
        <label className="block text-sm font-medium">
          Confirm your current password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-lg border border-[#CFDDD5] px-3 py-2 focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
          />
        </label>
        {deletionBusy && (
          <p role="status" className="mt-3 text-xs text-[#526159]">
            Finish or undo the current deletion first.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#294137]"
          >
            Keep account
          </button>
          <HoldToConfirmButton
            disabled={deletionBusy || !password}
            onConfirm={remove}
          >
            Hold to delete account
          </HoldToConfirmButton>
        </div>
      </form>
    </AccountModal>
  );
}
