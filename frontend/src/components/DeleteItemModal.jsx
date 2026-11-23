import P from "../ui/P";
import Button from "../ui/Button";
import AccountModal from "./AccountModal";
import HoldToConfirmButton from "./HoldToConfirmButton";

export default function DeleteItemModal({
  title,
  description,
  onDismiss,
  onConfirm,
}) {
  return (
    <AccountModal title={title} onDismiss={onDismiss}>
      <P variant="unstyled" className="text-sm leading-6 text-[#526159]">{description}</P>
      <P variant="unstyled" className="mt-3 text-xs leading-5 text-[#7c8c82]">
        Hold the button to confirm. You will have 5 seconds to undo before
        deletion becomes permanent.
      </P>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="unstyled"
          type="button"
          onClick={onDismiss}
          className="min-h-11 cursor-pointer rounded-md border border-[#cfddd5] px-4 text-sm font-semibold text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137]"
        >
          Cancel
        </Button>
        <HoldToConfirmButton onConfirm={onConfirm} />
      </div>
    </AccountModal>
  );
}
