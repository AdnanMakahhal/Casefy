import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { RiCheckboxMultipleLine } from "react-icons/ri";
import Button from "../../ui/Button";
import AccountModal from "../../components/AccountModal";
import { TEST_TYPES } from "./testTypes";

export default function TestTypeSelect({ value, onChange }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const allSelected = draft.length === TEST_TYPES.length;

  function show() {
    setDraft([...value]);
    setOpen(true);
  }

  function toggle(type, checked) {
    setDraft((current) => checked ? [...current, type] : current.filter((item) => item !== type));
  }

  function apply() {
    if (!draft.length) return;
    onChange(draft);
    setOpen(false);
  }

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[11px] font-medium text-[#526159]">Test types</label>
      <Button id={id} variant="outline" size="custom" aria-haspopup="dialog" aria-expanded={open}
        aria-describedby={`${id}-summary`} onClick={show}
        className="min-h-9 w-full justify-start gap-2 px-2.5 py-1.5 text-xs font-medium">
        <RiCheckboxMultipleLine size={17} aria-hidden="true" className="shrink-0" />
        <span className="min-w-0 flex-1 text-left">Choose test types</span>
        <span className="rounded bg-[#edf3ef] px-1.5 py-0.5 text-[10px] tabular-nums">{value.length} / {TEST_TYPES.length}</span>
      </Button>
      <p id={`${id}-summary`} className="mt-1.5 text-[11px] leading-4 text-[#718578]">
        {value.length ? `${value.length} selected. Edit your testing scope.` : "Choose at least one test type."}
      </p>
      {open && createPortal(
        <AccountModal title="Testing scope" icon={RiCheckboxMultipleLine} onDismiss={() => setOpen(false)}
          descriptionId={`${id}-description`} closeLabel="Close testing scope" className="max-w-xl">
          <p id={`${id}-description`} className="-mt-2 mb-5 text-sm leading-6 text-[#526159]">
            Choose the types of testing to include in your request.
          </p>
          <div className="mb-2 flex items-center justify-between gap-3 border-b border-[#e1e9e4] pb-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-[#294137]">
              <input type="checkbox" checked={allSelected}
                ref={(element) => { if (element) element.indeterminate = draft.length > 0 && !allSelected; }}
                onChange={(event) => setDraft(event.target.checked ? TEST_TYPES.map((type) => type.value) : [])}
                className="size-4 accent-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]" />
              Select all
            </label>
            <span role="status" className="text-xs text-[#718578]">{draft.length} of {TEST_TYPES.length} selected</span>
          </div>
          <fieldset className="space-y-1">
            <legend className="sr-only">Test types to include</legend>
            {TEST_TYPES.map((type) => (
              <label key={type.value} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-3 text-sm leading-5 text-[#294137] transition-colors hover:bg-[#edf3ef] focus-within:bg-[#edf3ef]">
                <input type="checkbox" checked={draft.includes(type.value)} onChange={(event) => toggle(type.value, event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[#294137] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]" />
                <span>{type.label}</span>
              </label>
            ))}
          </fieldset>
          <div className="mt-5 border-t border-[#e1e9e4] pt-4">
            <p className="mb-3 text-xs text-[#718578]">{draft.length ? "Apply to save your testing scope." : "Select at least one test type to continue."}</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!draft.length} onClick={apply}>Apply selection</Button>
            </div>
          </div>
        </AccountModal>,
        document.body,
      )}
    </div>
  );
}
