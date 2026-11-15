import { useEffect, useRef, useState } from "react";
import { BookOpen, Download, FileText, Globe, LockKeyhole, Menu, Settings2, UploadCloud, X } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import AccountModal from "../components/AccountModal";
import SelectMenu from "../components/SelectMenu";
import { DEFAULT_LLM_MODELS, ModelSelectorPrompt } from "../features/test-generation/model-selector-prompt";
import useWorkspaces from "../features/workspaces/useWorkspaces";
import { sessionRequest } from "../features/admin/api";
import GenerationResults from "../components/GenerationResults";

const sources = [
  { value: "story", label: "User story", icon: BookOpen },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "url", label: "Website URL", icon: Globe },
];
const testTypes = [
  { value: "functional", label: "Functional" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "edge", label: "Edge cases" },
  { value: "security", label: "Security" },
  { value: "accessibility", label: "Accessibility" },
];
const inputClass = "min-h-11 w-full rounded-lg border border-[#CFDDD5] bg-white px-3 py-2 text-sm text-[#102019] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]";

function formatSize(size) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }

export default function TestGenerator({ user }) {
  const staff = ["admin", "manager"].includes(user.role);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [source, setSource] = useState("story");
  const [prompts, setPrompts] = useState({ story: "", documents: "", url: "" });
  const [subject, setSubject] = useState("");
  const [modelValue, setModelValue] = useState(staff ? "openai" : DEFAULT_LLM_MODELS[0].value);
  const [providers, setProviders] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [configurations, setConfigurations] = useState({});
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [count, setCount] = useState("10");
  const [priority, setPriority] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState(["functional", "negative", "edge"]);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);
  const { workspaces: allWorkspaces } = useWorkspaces();
  const workspaces = allWorkspaces.filter((workspace) => workspace.role !== "viewer");
  const [selectedWorkspaceKey, setWorkspaceKey] = useState("");
  const workspaceKey = workspaces.some((w) => w.key === selectedWorkspaceKey) ? selectedWorkspaceKey : workspaces[0]?.key || "";
  const fileInput = useRef(null);
  const uploadButton = useRef(null);
  const urlInput = useRef(null);
  const countInput = useRef(null);
  const urlAllowed = staff || ["plus", "pro", "enterprise"].includes(user.plan);
  const urlLocked = source === "url" && !urlAllowed;
  const models = staff ? DEFAULT_LLM_MODELS.map((model, index) => {
    const provider = ["openai", "deepseek", "gemini"][index];
    const integration = providers.find((item) => item.provider === provider);
    return { ...model, value: provider, version: integration?.model || "Configure in API integrations", description: integration?.available ? "Connected. Generate tests with unlimited staff runs." : "Add and enable this provider in API integrations to generate tests." };
  }) : DEFAULT_LLM_MODELS;
  useEffect(() => {
    if (!staff) return;
    let active = true;
    sessionRequest("/generation/providers").then((data) => { if (active) setProviders(data.providers); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [staff]);

  function changeSource(next) { setSource(next); setError(""); }
  function addFiles(incoming) {
    setError("");
    const selected = Array.from(incoming);
    if (selected.some((file) => !/\.(pdf|docx|txt|md)$/i.test(file.name))) { setError("Choose PDF, DOCX, TXT, or Markdown documents."); return; }
    if (selected.some((file) => file.size === 0 || file.size > 10 * 1024 * 1024)) { setError("Each document must contain content and be no larger than 10 MB."); return; }
    const next = [...files];
    for (const file of selected) if (!next.some((current) => current.name === file.name && current.size === file.size && current.lastModified === file.lastModified)) next.push(file);
    if (next.length > 5) { setError("Attach up to 5 documents per request."); return; }
    const staffUploadMB = import.meta.env.PROD ? 2 : 10;
    if (staff && next.reduce((total, file) => total + file.size, 0) > staffUploadMB * 1024 * 1024) { setError(`Staff generation supports up to ${staffUploadMB} MB of documents in total.`); return; }
    setFiles(next);
  }
  function toggleType(type) {
    setSelectedTypes((current) => current.includes(type) ? current.filter((value) => value !== type) : [...current, type]);
    setError("");
  }
  function review({ model, configuration, prompt, subject }) {
    setError("");
    if (urlLocked) return;
    if (source === "story" && (!subject || !prompt)) { setError("Add a subject and description before reviewing your request."); return; }
    if (staff && subject?.length > 160) { setError("Keep the subject to 160 characters or fewer."); return; }
    if (!count.trim() || !Number.isSafeInteger(Number(count)) || Number(count) < 1) { setError("Enter a whole number of test cases greater than zero."); countInput.current?.focus(); return; }
    if (staff && Number(count) > 100) { setError("Generate up to 100 cases per request. Staff can run unlimited requests."); countInput.current?.focus(); return; }
    if (source === "documents" && !files.length) { setError("Attach at least one document to continue."); uploadButton.current?.focus(); return; }
    let targetUrl;
    if (source === "url") {
      try {
        targetUrl = new URL(url.trim());
        if (!["http:", "https:"].includes(targetUrl.protocol) || targetUrl.username || targetUrl.password) throw new Error("Invalid URL");
      } catch { setError("Enter a valid HTTP or HTTPS website URL without embedded credentials."); urlInput.current?.focus(); return; }
    }
    if (!selectedTypes.length) { setError("Select at least one test type."); return; }
    setRequest({
      preview: !staff,
      source,
      workspace: workspaces.find(({ key }) => key === workspaceKey) || null,
      model: { value: model.value, label: model.label, version: model.version },
      configuration,
      prompt,
      ...(source === "story" ? { subject, description: prompt } : {}),
      filters: { count: Number(count), priority, testTypes: [...selectedTypes] },
      ...(targetUrl ? { url: targetUrl.href } : {}),
      ...(source === "documents" ? { documents: files.map((file) => ({ name: file.name, size: file.size, type: file.type })), documentContentsIncluded: false } : {}),
    });
  }
  function downloadRequest() {
    const address = URL.createObjectURL(new Blob([JSON.stringify(request, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = address;
    link.download = "casefy-generation-request.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(address), 1000);
  }
  async function generate() {
    if (generating) return;
    setGenerating(true); setError("");
    try {
      const documents = request.source === "documents" ? await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, content: reader.result.split(",")[1] }); reader.onerror = () => reject(new Error("Unable to read requirement document.")); reader.readAsDataURL(file);
      }))) : undefined;
      const response = await sessionRequest("/generation", { method: "POST", body: JSON.stringify({ source: request.source, provider: request.model.value, subject: request.subject || (request.source === "documents" ? "Document test coverage" : "Website test coverage"), prompt: request.prompt, url: request.url, documents, filters: request.filters, configuration: request.configuration }) });
      setResult(response.run); setRequest(null);
    } catch (err) { setError(err.message); } finally { setGenerating(false); }
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3"><button type="button" aria-label="Open navigation" aria-controls="dashboard-sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#CFDDD5] bg-white text-[#294137] focus-visible:outline-2 focus-visible:outline-[#294137] lg:hidden"><Menu size={20} aria-hidden="true" /></button><div><h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Test generator</h1><p className="mt-2 text-sm leading-6 text-[#526159]">Turn your requirements into a clear testing plan.</p></div></div>
          {workspaces.length > 0 && <SelectMenu id="generator-workspace" label="Workspace for this request" className="w-full sm:w-60" value={workspaceKey} onChange={setWorkspaceKey} options={workspaces.map((workspace) => ({ value: workspace.key, label: workspace.name, description: "Workspace for this request" }))} />}
        </header>

        <div className="mx-auto mt-8 max-w-6xl">

          <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#dce6df] bg-[#eaf0ec] p-1.5" role="group" aria-label="Requirement source">
            {sources.map(({ value, label, icon: Icon }) => <button key={value} type="button" aria-pressed={source === value} onClick={() => changeSource(value)} className={`inline-flex min-h-12 cursor-pointer flex-wrap items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] sm:px-5 sm:text-sm ${source === value ? "bg-white text-[#294137] shadow-sm ring-1 ring-[#cfddd5]" : "text-[#526159] hover:bg-white/60"}`}><Icon size={16} aria-hidden="true" />{label}{value === "url" && !urlAllowed && <LockKeyhole size={12} aria-label="Paid plans" />}</button>)}
          </div>


          {urlLocked ? <div className="mt-4 rounded-2xl border border-[#CFDDD5] bg-white p-8 text-center sm:p-12"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#edf3ef] text-[#294137]"><LockKeyhole size={22} aria-hidden="true" /></span><h3 className="mt-5 text-xl font-bold tracking-tight">Go beyond requirements with a URL</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#526159]">Website URL input is included with Plus, Pro, and Enterprise. Your Free plan includes user stories and documents.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/pricing" className="inline-flex min-h-11 items-center rounded-lg bg-[#294137] px-5 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">View plans</Link><button type="button" onClick={() => changeSource("story")} className="min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-5 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]">Use a user story</button></div></div> : <div className="mt-4">
            <ModelSelectorPrompt subject={subject} onSubjectChange={source === "story" ? (value) => { setSubject(value); setError(""); } : undefined} settingsPosition={source === "story" ? "left" : "inline"} models={models} value={modelValue} configurations={configurations} onConfigurationChange={(_model, _configuration, next) => setConfigurations(next)} onModelChange={(model) => setModelValue(model.value)} prompt={prompts[source]} onPromptChange={(prompt) => { setPrompts((current) => ({ ...current, [source]: prompt })); setError(""); }} onSubmit={review} promptRequired={source === "story"} promptLabel={source === "story" ? "User story or requirements" : "Additional instructions (optional)"} placeholder={source === "story" ? "What do you want to test?\n\nAs a user, I want to...\nAdd your acceptance criteria and expected behavior." : "Tell us what to focus on, what to exclude, or any specific behavior to cover."}
              settings={<div className={`px-5 py-5 ${source === "story" ? "" : "border-t border-[#e1e9e4] sm:px-7"}`}><div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-wider text-[#526159]"><Settings2 size={15} aria-hidden="true" />COVERAGE FILTERS</div><div className={`grid gap-4 ${source === "story" ? "sm:grid-cols-2 xl:grid-cols-1" : "sm:grid-cols-2"}`}>
<div><label htmlFor="test-count" className="mb-2 block text-xs font-medium text-[#526159]">Test cases</label><input ref={countInput} id="test-count" name="testCount" type="number" inputMode="numeric" min="1" step="1" max={staff ? 100 : Number.MAX_SAFE_INTEGER} required value={count} onChange={(event) => { setCount(event.target.value); setError(""); }} aria-describedby="test-count-hint" className={`${inputClass} rounded-xl tabular-nums`} /><p id="test-count-hint" className="mt-2 text-[11px] leading-5 text-[#7c8c82]">{staff ? "Unlimited staff runs. Up to 100 cases per request." : "Enter the number of test cases you need."}</p></div>
<div><label htmlFor="test-priority" className="mb-2 block text-xs font-medium text-[#526159]">Priority</label><SelectMenu id="test-priority" label="Priority" value={priority} onChange={setPriority} options={[{ value: "all", label: "All priorities", description: "Include every priority level" }, { value: "high", label: "High", description: "Critical paths and core behavior" }, { value: "medium", label: "Medium", description: "Common workflows and scenarios" }, { value: "low", label: "Low", description: "Lower-impact behavior" }]} /></div>
</div><fieldset className="mt-4"><legend className="mb-2 text-xs font-medium text-[#526159]">Test types</legend><div className="flex flex-wrap gap-2">{testTypes.map(({ value, label }) => <button key={value} type="button" aria-pressed={selectedTypes.includes(value)} onClick={() => toggleType(value)} className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${selectedTypes.includes(value) ? "border-[#294137] bg-[#294137] text-white hover:bg-[#20332b]" : "border-[#dce6df] bg-white text-[#6c8073] hover:border-[#a9bfb0] hover:bg-[#edf3ef]"}`}>{label}</button>)}</div></fieldset></div>}>
              {source === "documents" && <div className="border-b border-[#e1e9e4] p-5 sm:p-7">
                <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md" multiple tabIndex={-1} aria-label="Choose requirement documents" onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} className="sr-only" />
                <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }} className={`rounded-xl border border-dashed px-5 py-7 text-center transition-colors ${dragging ? "border-[#294137] bg-[#e2ece6]" : "border-[#afc4b7] bg-[#f6f8f7]"}`}><UploadCloud size={25} aria-hidden="true" className="mx-auto mb-3 text-[#526159]" /><p className="text-sm font-semibold text-[#294137]">Drop your requirements here</p><p className="mt-1.5 text-xs leading-5 text-[#7c8c82]">PDF, DOCX, TXT, or Markdown · Up to 5 files, {staff ? `${import.meta.env.PROD ? 2 : 10} MB total` : "10 MB each"}</p><button ref={uploadButton} type="button" onClick={() => fileInput.current.click()} className="mt-4 min-h-10 cursor-pointer rounded-lg border border-[#CFDDD5] bg-white px-4 text-xs font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">Browse documents</button></div>
                {files.length > 0 && <ul aria-label="Attached documents" className="mt-4 space-y-2">{files.map((file, index) => <li key={`${file.name}-${file.lastModified}-${file.size}`} className="flex items-center gap-3 rounded-lg border border-[#dce6df] px-3 py-2"><FileText size={17} aria-hidden="true" className="shrink-0 text-[#526159]" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium" title={file.name}>{file.name}</span><span className="text-xs text-[#7c8c82]">{formatSize(file.size)}</span></span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, at) => at !== index))} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#526159] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"><X size={16} aria-hidden="true" /></button></li>)}</ul>}
              </div>}
              {source === "url" && <div className="border-b border-[#e1e9e4] p-5 sm:p-7"><label htmlFor="website-url" className="text-sm font-semibold text-[#294137]">Website URL</label><div className="relative mt-3"><Globe size={18} aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 text-[#7c8c82]" /><input ref={urlInput} id="website-url" name="websiteUrl" type="url" placeholder="https://your-app.com" required value={url} onChange={(event) => { setUrl(event.target.value); setError(""); }} className={`${inputClass} pl-11`} /></div><p className="mt-2 text-xs leading-5 text-[#7c8c82]">{staff ? "Casefy reads the public page as requirements. This generates test cases; it does not execute browser tests." : "Add the page you want to cover. This preview does not visit the website."}</p></div>}
            </ModelSelectorPrompt>
          </div>}

          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        </div>

        {staff && <p className="mt-6 rounded-lg border border-[#CFDDD5] bg-white p-4 text-sm text-[#526159]">Admin and manager access: unlimited generation runs, no Casefy monthly credit limit. <Link to="/admin?view=integrations" className="font-semibold text-[#294137] underline">Configure AI providers</Link></p>}
        {result && <div className="mt-6 rounded-xl border border-[#CFDDD5] bg-white p-6"><GenerationResults run={result} /></div>}
        {request && <AccountModal title="Review generation request" busy={generating} onDismiss={() => setRequest(null)}>
          <p className="mb-5 rounded-lg bg-[#edf3ef] p-3 text-xs leading-5 text-[#526159]">{staff ? "Unlimited staff generation uses your configured provider. Provider charges and rate limits still apply. Click Generate tests to send these requirements." : "This is a request preview. No AI request has been sent and no credits have been used."}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">{[
            ["Source", sources.find(({ value }) => value === request.source)?.label], ["Workspace", request.workspace?.name || "Not selected"], ["Model / provider", `${request.model.label} / ${request.model.version}${staff ? "" : " (preview)"}`], ["Test cases", request.filters.count], ["Priority", request.filters.priority === "all" ? "All priorities" : request.filters.priority], ["Output detail", request.configuration.detail],
          ].map(([label, value]) => <div key={label}><dt className="text-xs text-[#7c8c82]">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>)}</dl>
          <p className="mt-5 text-xs text-[#7c8c82]">Test types</p><p className="mt-1 text-sm leading-6">{request.filters.testTypes.map((value) => testTypes.find((type) => type.value === value)?.label).join(", ")}</p>
          {request.url && <><p className="mt-5 text-xs text-[#7c8c82]">Website URL</p><p className="mt-1 break-all text-sm">{request.url}</p></>}
          {request.documents && <><p className="mt-5 text-xs text-[#7c8c82]">Documents</p><ul className="mt-2 space-y-1 text-sm">{request.documents.map((file) => <li key={file.name} className="break-words">{file.name} · {formatSize(file.size)}</li>)}</ul><p className="mt-2 text-xs leading-5 text-[#7c8c82]">The downloaded request includes file names and sizes, without document contents.</p></>}
          {request.subject && <><p className="mt-5 text-xs text-[#7c8c82]">Subject</p><p className="mt-1 break-words text-sm font-medium">{request.subject}</p></>}{request.prompt && <><p className="mt-5 text-xs text-[#7c8c82]">{request.subject ? "Description" : "Requirements / instructions"}</p><p className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-[#f6f8f7] p-4 text-sm leading-6">{request.prompt}</p></>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{staff && <button type="button" disabled={generating} onClick={generate} className="mt-6 min-h-11 w-full rounded-lg bg-[#294137] px-5 text-sm font-semibold text-white disabled:opacity-50">{generating ? "Generating tests..." : "Generate tests"}</button>}<div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={downloadRequest} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"><Download size={16} aria-hidden="true" />Download request</button><button type="button" disabled={generating} onClick={() => setRequest(null)} className="min-h-11 cursor-pointer rounded-lg bg-[#294137] px-5 text-sm font-semibold text-white hover:bg-[#20332b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]">Done</button></div>
        </AccountModal>}
      </main>
    </div>
  );
}
