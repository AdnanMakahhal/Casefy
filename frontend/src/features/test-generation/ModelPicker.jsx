import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { DEFAULT_MODEL_CONFIGURATION } from "./models";

export default function ModelPicker({ models, model, configurations, onModelChange, onConfigurationChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef(null);
  const trigger = useRef(null);
  const search = useRef(null);
  const panel = useRef(null);
  const id = useId();
  const filtered = models.filter((item) => `${item.label} ${item.provider || ""} ${item.version || ""}`.toLowerCase().includes(query.toLowerCase()));
  const configuration = { ...DEFAULT_MODEL_CONFIGURATION, ...configurations[model?.value] };

  useEffect(() => {
    if (!open) return;
    // Keep the phone keyboard closed until the user chooses to search.
    if (window.matchMedia("(min-width: 640px)").matches) search.current?.focus();
    else panel.current?.focus();
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function update(key, value) {
    const next = { ...configuration, [key]: value };
    onConfigurationChange?.(model.value, next, { ...configurations, [model.value]: next });
  }
  function close() { setOpen(false); trigger.current?.focus(); }

  return (
    <div ref={root} className="relative min-w-0" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); }
    }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button ref={trigger} type="button" disabled={disabled} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-picker`} onClick={() => { setQuery(""); setOpen(!open); }} className="inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-[#cfddd5] bg-white px-3 py-2 text-sm font-medium text-[#294137] transition-colors hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:opacity-50">
        <img src={model?.logo} alt="" aria-hidden="true" className="size-5 shrink-0 object-contain" /><span className="truncate">{model?.label}</span><ChevronDown size={14} aria-hidden="true" className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div ref={panel} tabIndex={-1} id={`${id}-picker`} role="dialog" aria-label="Choose a model" className="absolute bottom-full left-0 z-50 mb-2 max-h-[min(65dvh,480px)] w-[min(21rem,calc(100vw_-_4rem))] overflow-y-auto rounded-xl border border-[#cfddd5] bg-white shadow-[0_8px_30px_#20332b1a] outline-none">
        <div className="flex items-center justify-between gap-2 px-4 pt-3"><h3 className="text-xs font-semibold text-[#294137]">Choose a model</h3><button type="button" onClick={close} aria-label="Close model picker" className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#718578] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"><X size={15} aria-hidden="true" /></button></div>
        <div className="relative mx-3 mt-1 mb-2"><Search size={15} aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3 text-[#718578]" /><input ref={search} aria-label="Search models" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter") { event.preventDefault(); if (filtered[0]) { onModelChange?.(filtered[0]); close(); } }
          else if (event.key === "ArrowDown") { event.preventDefault(); root.current.querySelector('[data-model-option]')?.focus(); }
        }} placeholder="Search models" className="min-h-11 w-full rounded-lg border border-[#dce6df] bg-[#f6f8f7] pr-3 pl-9 text-sm text-[#294137] placeholder:text-[#8a9890] focus:outline-2 focus:outline-[#91a99a]" /></div>
        <div role="group" aria-label="Available models" className="space-y-1 px-2 pb-2" onKeyDown={(event) => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const items = [...event.currentTarget.querySelectorAll('button')];
          const current = items.indexOf(document.activeElement);
          const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
          items[next]?.focus();
        }}>
          {filtered.map((item) => <button key={item.value} data-model-option type="button" aria-pressed={model?.value === item.value} onClick={() => onModelChange?.(item)} className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] ${model?.value === item.value ? "bg-[#edf3ef]" : "hover:bg-[#f6f8f7]"}`}>
            <img src={item.logo} alt="" aria-hidden="true" className="size-6 shrink-0 object-contain" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-[#294137]">{item.label}</span><span className="mt-0.5 block break-words text-[11px] leading-4 text-[#7c8c82]">{item.version || item.provider}</span></span>{model?.value === item.value && <Check size={15} className="shrink-0 text-[#294137]" aria-hidden="true" />}
          </button>)}
          {!filtered.length && <p className="px-3 py-5 text-center text-xs text-[#7c8c82]">No matching models.</p>}
        </div>
        {model && <details className="group border-t border-[#e1e9e4]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-xs font-medium text-[#526159] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] [&::-webkit-details-marker]:hidden"><SlidersHorizontal size={14} aria-hidden="true" />{model.label} settings<ChevronDown size={13} aria-hidden="true" className="ml-auto transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
          <div className="space-y-4 px-4 pb-4">
            <fieldset><legend className="mb-2 text-[11px] font-medium text-[#718578]">Reasoning</legend><div className="grid grid-cols-3 gap-1 rounded-lg bg-[#eaf0ec] p-1">{["low", "medium", "high"].map((level) => <button key={level} type="button" aria-pressed={configuration.reasoning === level} onClick={() => update("reasoning", level)} className={`min-h-10 cursor-pointer rounded-md text-xs capitalize focus-visible:outline-2 focus-visible:outline-[#294137] ${configuration.reasoning === level ? "bg-white font-semibold text-[#294137] shadow-sm" : "text-[#718578] hover:text-[#294137]"}`}>{level}</button>)}</div></fieldset>
            <fieldset><legend className="mb-2 text-[11px] font-medium text-[#718578]">Output detail</legend><div className="grid grid-cols-2 gap-2">{["standard", "detailed"].map((detail) => <button key={detail} type="button" aria-pressed={configuration.detail === detail} onClick={() => update("detail", detail)} className={`min-h-10 cursor-pointer rounded-lg border px-2 text-xs capitalize focus-visible:outline-2 focus-visible:outline-[#294137] ${configuration.detail === detail ? "border-[#91a99a] bg-[#edf3ef] font-semibold text-[#294137]" : "border-[#dce6df] text-[#718578]"}`}>{detail}</button>)}</div></fieldset>
          </div>
        </details>}
        <div className="flex items-center justify-between gap-3 border-t border-[#e1e9e4] px-3 py-2.5"><p className="text-[10px] text-[#8a9890]">AI connection pending</p><button type="button" onClick={close} className="min-h-10 cursor-pointer rounded-lg bg-[#294137] px-4 text-xs font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">Done</button></div>
      </div>}
    </div>
  );
}
