import { useEffect, useId, useRef, useState } from "react";
import { RiEqualizerLine, RiCloseLine } from "react-icons/ri";
import Button from "../../ui/Button";
import P from "../../ui/P";
import Span from "../../ui/Span";
import { GENERATION_MODE, DEFAULT_MODEL_CONFIGURATION } from "./models";

const ModeIcon = GENERATION_MODE.icon;

export default function GenerationSettings({ configuration, onConfigurationChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const heading = useRef(null);
  const id = useId();
  const current = { ...DEFAULT_MODEL_CONFIGURATION, ...configuration };

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function update(key, value) {
    onConfigurationChange?.({ ...current, [key]: value });
  }

  return (
    <div ref={root} className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
      <Button ref={trigger} variant="outline" size="custom" disabled={disabled} aria-label="AI generation settings" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)} className="min-h-11 max-w-full gap-2 px-3 py-2 font-medium">
        <ModeIcon size={20} aria-hidden="true" className="shrink-0" />
        <Span className="truncate">AI-assisted generation</Span>
        <RiEqualizerLine size={16} aria-hidden="true" className="shrink-0" />
      </Button>
      {open && (
        <div id={id} role="dialog" aria-labelledby={`${id}-heading`} className="absolute bottom-full left-0 z-50 mb-2 w-[min(21rem,calc(100vw_-_4rem))] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-[#CFDDD5] bg-white shadow-[0_8px_30px_#20332b1a]">
          <div className="flex items-center justify-between gap-3 px-4 pt-3">
            <h3 id={`${id}-heading`} ref={heading} tabIndex={-1} className="text-sm font-semibold text-[#294137] outline-none">Generation settings</h3>
            <Button variant="ghost" size="icon" onClick={close} aria-label="Close generation settings"><RiCloseLine size={17} aria-hidden="true" /></Button>
          </div>
          <P variant="unstyled" className="px-4 pb-4 text-xs leading-5 text-[#718578]">Choose the reasoning and output detail for your request.</P>
          <fieldset disabled={disabled} className="space-y-4 border-t border-[#e1e9e4] p-4">
            <legend className="sr-only">AI generation configuration</legend>
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-[#526159]">Reasoning</legend>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-[#eaf0ec] p-1">
                {["low", "medium", "high"].map((level) => (
                  <Button key={level} variant="unstyled" aria-pressed={current.reasoning === level} onClick={() => update("reasoning", level)} className={`min-h-10 rounded-md text-xs capitalize focus-visible:outline-2 focus-visible:outline-[#294137] ${current.reasoning === level ? "bg-white font-semibold text-[#294137] shadow-sm" : "text-[#718578] hover:text-[#294137]"}`}>{level}</Button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-[#526159]">Output detail</legend>
              <div className="grid grid-cols-2 gap-2">
                {["standard", "detailed"].map((detail) => (
                  <Button key={detail} variant="unstyled" aria-pressed={current.detail === detail} onClick={() => update("detail", detail)} className={`min-h-10 rounded-md border px-2 text-xs capitalize focus-visible:outline-2 focus-visible:outline-[#294137] ${current.detail === detail ? "border-[#91a99a] bg-[#edf3ef] font-semibold text-[#294137]" : "border-[#dce6df] text-[#718578]"}`}>{detail}</Button>
                ))}
              </div>
            </fieldset>
          </fieldset>
          <div className="flex justify-end border-t border-[#e1e9e4] px-4 py-3"><Button size="sm" onClick={close}>Done</Button></div>
        </div>
      )}
    </div>
  );
}
