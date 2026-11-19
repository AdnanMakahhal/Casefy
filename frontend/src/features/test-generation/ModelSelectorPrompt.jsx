import { useId } from "react";
import {
  RiLoader4Line as LoaderCircle,
  RiSendPlane2Line as Send
} from "react-icons/ri";
import ModelPicker from "./ModelPicker";
import { GENERATION_MODES, DEFAULT_MODEL_CONFIGURATION } from "./models";

export function ModelSelectorPrompt({
  models = GENERATION_MODES,
  value,
  configurations = {},
  onConfigurationChange,
  onModelChange,
  prompt,
  onPromptChange,
  subject = "",
  onSubjectChange,
  onSubmit,
  children,
  settings,
  settingsPosition = "inline",
  promptLabel = "Description",
  promptRequired = true,
  showPrompt = true,
  submitLabel = "Generate tests",
  isSubmitting = false,
  disabled = false,
}) {
  const id = useId();
  const model = models.find((item) => item.value === value) || models[0];
  const configuration = {
    ...DEFAULT_MODEL_CONFIGURATION,
    ...configurations[model?.value],
  };
  const sidebar = settingsPosition === "left" && settings;
  const hasSubject = typeof onSubjectChange === "function";

  function submit(event) {
    event.preventDefault();
    if (disabled || isSubmitting || !model) return;
    onSubmit?.({
      model,
      configuration,
      prompt: showPrompt ? prompt.trim() : "",
      ...(hasSubject ? { subject: subject.trim() } : {}),
    });
  }

  return (
    <div
      className={
        sidebar
          ? "grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)]"
          : "min-w-0"
      }
    >
      {sidebar && (
        <aside
          aria-label="Coverage filters"
          className="order-2 min-w-0 rounded-md border border-[#dce6df] bg-white shadow-[0_4px_20px_#29413704] xl:order-1"
        >
          {settings}
        </aside>
      )}
      <form
        onSubmit={submit}
        className={`min-w-0 rounded-md border border-[#cfddd5] bg-white shadow-[0_8px_32px_#29413708] transition-shadow focus-within:border-[#91a99a] focus-within:shadow-[0_8px_32px_#2941370e] ${sidebar ? "order-1 xl:order-2" : ""}`}
      >
        <fieldset disabled={disabled || isSubmitting} className="min-w-0">
          <legend className="sr-only">Test generation request</legend>
          {settingsPosition === "top" && settings}
          {children}
          {(hasSubject || showPrompt) && <div className="px-5 pt-6 sm:px-7 sm:pt-7">
            {hasSubject && (
              <div className="mb-5">
                <label
                  htmlFor={`${id}-subject`}
                  className="mb-2 block text-sm font-medium text-[#294137]"
                >
                  Test / project name
                </label>
                <input
                  id={`${id}-subject`}
                  name="subject"
                  type="text"
                  value={subject}
                  onChange={(event) => onSubjectChange(event.target.value)}
                  required
                  maxLength={100}
                  className="min-h-11 w-full rounded-md border border-[#cfddd5] bg-white px-3 text-sm text-[#20332b] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
                />
              </div>
            )}
            {showPrompt && <>
            <label
              htmlFor={`${id}-prompt`}
              className="mb-2 block text-sm font-medium text-[#294137]"
            >
              {promptLabel}
            </label>
            <textarea
              id={`${id}-prompt`}
              name="prompt"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              required={promptRequired}
              maxLength={20000}
              rows={6}
              aria-describedby={`${id}-hint`}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  event.currentTarget.form.requestSubmit();
                }
              }}
              className="min-h-48 w-full resize-y rounded-md border border-[#cfddd5] bg-white px-3 py-3 text-sm leading-6 text-[#20332b] caret-[#294137] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
            />
            <div
              id={`${id}-hint`}
              className="mb-4 mt-2 flex justify-end text-[11px] leading-5 text-[#8a9890]"
            >
              <span className="tabular-nums">
                {prompt.length.toLocaleString()} / 20,000
              </span>
            </div>
            </>}
          </div>}
          {!sidebar && settingsPosition !== "top" && settings}
          <div className="relative mx-3 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#f6f8f7] p-3 sm:mx-4 sm:mb-4">
            <ModelPicker
              models={models}
              model={model}
              configurations={configurations}
              onModelChange={onModelChange}
              onConfigurationChange={onConfigurationChange}
              disabled={disabled || isSubmitting}
            />
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#20332b] bg-[#294137] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Send size={16} aria-hidden="true" />
              )}
              {isSubmitting ? "Preparing..." : submitLabel}
            </button>
          </div>
          {showPrompt && <p className="mb-4 text-center text-[10px] text-[#8a9890]">
            Ctrl / Cmd + Enter to review
          </p>}
        </fieldset>
      </form>
    </div>
  );
}
