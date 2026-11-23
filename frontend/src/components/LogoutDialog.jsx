import P from "../ui/P";
import Button from "../ui/Button";
import { useId } from "react";
import { RiLogoutBoxRLine as LogOut } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import AccountModal from "./AccountModal";

export default function LogoutDialog({ onDismiss }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const descriptionId = useId();
  return (
    <AccountModal title="Log out?" icon={LogOut} className="max-w-md sm:p-6" descriptionId={descriptionId} closeLabel="Close logout dialog" onDismiss={onDismiss}>
      <P variant="unstyled" id={descriptionId} className="text-sm leading-6 text-[#526159]">
        You’ll return to the sign-in page. Sign back in anytime to access your workspace.
      </P>
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#e1e9e4] pt-5">
        <Button variant="outline"
          type="button"
          onClick={onDismiss}
          autoFocus
        >
          Cancel
        </Button>
        <Button variant="primary"
          type="button"
          onClick={() => {
            logout();
            navigate("/signin", { replace: true });
          }}
        >
          Log out
        </Button>
      </div>
    </AccountModal>
  );
}
