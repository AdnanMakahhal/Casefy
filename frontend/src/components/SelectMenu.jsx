import { useEffect, useId, useRef, useState } from "react";
import {
  RiCheckLine as Check,
  RiArrowDownSLine as ChevronDown,
} from "react-icons/ri";

export default function SelectMenu({
  id,
  value,
  onChange,
  options,
  label,
  className = "",
  placement = "bottom",
  disabled = false,
  compact = false,
}) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const menu = useRef(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (open)
      menu.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function show() {
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    );
    setOpen(true);
  }

  function choose(option) {
    onChange(option.value);
    setOpen(false);
  }

  function navigate(event) {
    if (
      ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(
        event.key,
      )
    ) {
      event.preventDefault();
      if (event.key === "Escape") {
        if (open) event.stopPropagation();
        setOpen(false);
      } else if (!open) show();
      else if (event.key === "Enter" || event.key === " ")
        choose(options[active]);
      else if (event.key === "Home") setActive(0);
      else if (event.key === "End") setActive(options.length - 1);
      else
        setActive(
          (index) =>
            (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) %
            options.length,
        );
    } else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const index = options.findIndex((option) =>
        option.label.toLowerCase().startsWith(event.key.toLowerCase()),
      );
      if (index >= 0) {
        event.preventDefault();
        setActive(index);
        setOpen(true);
      }
    }
  }

  return (
    <div ref={root} className={`relative min-w-0 ${className}`}>
      <button
        id={controlId}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${controlId}-options`}
        aria-haspopup="listbox"
        aria-activedescendant={
          open ? `${controlId}-option-${active}` : undefined
        }
        disabled={disabled || !options.length}
        onKeyDown={navigate}
        onBlur={() => setOpen(false)}
        onClick={() => (open ? setOpen(false) : show())}
        className={`flex w-full cursor-pointer items-center border bg-white text-left text-[#294137] transition-colors hover:border-[#91a99a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50 ${compact ? "min-h-9 gap-2 rounded-md px-2.5 py-1.5 text-xs" : "min-h-11 gap-3 rounded-md px-3.5 py-2.5 text-sm shadow-sm"} ${open ? "border-[#91a99a] ring-2 ring-[#2941370d]" : "border-[#CFDDD5]"}`}
      >
        {selected?.initial && (
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#edf3ef] text-xs font-bold"
          >
            {selected.initial}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate font-medium">
          {selected?.label || "Select an option"}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-[#718578] transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          ref={menu}
          id={`${controlId}-options`}
          role="listbox"
          aria-label={label}
          onMouseDown={(event) => event.preventDefault()}
          className={`absolute left-0 z-40 max-h-50 w-full min-w-0 overflow-y-auto rounded-md border border-[#dce6df] bg-white p-1.5 overflow-hidden shadow-[0_12px_32px_#20332b1a] ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${controlId}-option-${index}`}
              role="option"
              aria-selected={value === option.value}
              onPointerMove={() => setActive(index)}
              onClick={() => choose(option)}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm ${active === index ? "bg-[#edf3ef] text-[#20332b]" : "text-[#526159]"}`}
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block break-words ${value === option.value ? "font-semibold" : "font-medium"}`}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-xs leading-5 text-[#7c8c82] text-ellipsis text-overflow:ellipsis overflow-hidden whitespace-nowrap">
                    {option.description}
                  </span>
                )}
              </span>
              {value === option.value && (
                <Check
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-[#294137]"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
