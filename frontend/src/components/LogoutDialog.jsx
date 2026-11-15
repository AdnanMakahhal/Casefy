import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import AccountModal from "./AccountModal";

export default function LogoutDialog({ onDismiss }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <AccountModal title="Log out of Casefy?" onDismiss={onDismiss}>
      <p className="text-sm leading-6 text-[#526159]">
        You can log back in any time to access your workspace.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[#294137]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/signin", { replace: true });
          }}
          className="min-h-11 cursor-pointer rounded-lg bg-[#294137] px-4 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
        >
          Log out
        </button>
      </div>
    </AccountModal>
  );
}
