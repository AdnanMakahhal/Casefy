import P from "../ui/P";
import Span from "../ui/Span";
import Button from "../ui/Button";
import Heading from "../ui/Heading";
import { useRef, useState } from "react";
import {
  RiBookOpenLine as BookOpen,
  RiDownloadLine as Download,
  RiFileTextLine as FileText,
  RiGlobalLine as Globe,
  RiLock2Line as LockKeyhole,
  RiMenuLine as Menu,
  RiUploadCloud2Line as UploadCloud,
  RiCloseLine as X,
} from "react-icons/ri";
import { Link, useSearchParams } from "react-router-dom";
import DashboardSidebar from "../components/DashboardSidebar";
import AccountModal from "../components/AccountModal";
import SelectMenu from "../components/SelectMenu";
import { GENERATION_MODE, DEFAULT_MODEL_CONFIGURATION } from "../features/test-generation/models";
import { ModelSelectorPrompt } from "../features/test-generation/ModelSelectorPrompt";
import useWorkspaces from "../features/workspaces/useWorkspaces";
import { workspacePath, workspaceRequest } from "../features/workspaces/api";

const sources = [
  { value: "story", label: "User story", icon: BookOpen },
  { value: "documents", label: "Documents", icon: FileText },
  { value: "url", label: "URL", icon: Globe },
];
const testTypes = [
  { value: "functional", label: "Functional" },
  { value: "positive", label: "Positive" },
  { value: "negative", label: "Negative" },
  { value: "edge", label: "Edge cases" },
  { value: "security", label: "Security" },
  { value: "accessibility", label: "Accessibility" },
];
const inputClass =
  "min-h-11 w-full rounded-md border border-[#CFDDD5] bg-white px-3 py-2 text-sm text-[#102019] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]";

function formatSize(size) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function TestGenerator({ user, project, projectWorkspace }) {
  const initialRequest = project?.generationRequest;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [source, setSource] = useState(initialRequest?.source || "story");
  const [prompts, setPrompts] = useState(() => ({
    story: "",
    documents: "",
    url: "",
    [initialRequest?.source || "story"]:
      initialRequest?.prompt || project?.description || "",
  }));
  const [subject, setSubject] = useState(project?.name || "");
  const [configuration, setConfiguration] = useState(() => ({
    ...DEFAULT_MODEL_CONFIGURATION,
    ...initialRequest?.configuration,
  }));
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState(initialRequest?.url || "");
  const [compareWithDocuments, setCompareWithDocuments] = useState(
    initialRequest?.compareWithDocuments === true,
  );
  const [dragging, setDragging] = useState(false);
  const [count, setCount] = useState(
    String(initialRequest?.filters?.count || 10),
  );
  const [priority, setPriority] = useState(
    initialRequest?.filters?.priority || "all",
  );
  const [selectedTypes, setSelectedTypes] = useState(
    initialRequest?.filters?.testTypes || ["functional", "negative", "edge"],
  );
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedProject, setSavedProject] = useState(null);
  const [projectDescription, setProjectDescription] = useState("");
  const [params] = useSearchParams();
  const {
    workspaces: allWorkspaces,
    loading: workspacesLoading,
    error: workspaceError,
  } = useWorkspaces();
  const workspaces = projectWorkspace
    ? [projectWorkspace]
    : allWorkspaces.filter((workspace) => workspace.role !== "viewer");
  const [selectedWorkspaceKey, setWorkspaceKey] = useState(
    () => params.get("workspace") || "",
  );
  const workspaceKey =
    projectWorkspace?.key ||
    (workspaces.some((w) => w.key === selectedWorkspaceKey)
      ? selectedWorkspaceKey
      : workspaces[0]?.key || "");
  const fileInput = useRef(null);
  const uploadButton = useRef(null);
  const urlInput = useRef(null);
  const countInput = useRef(null);
  const urlAllowed = ["plus", "pro", "ultra"].includes(user.plan);
  const urlLocked = source === "url" && !urlAllowed;
  const comparisonActive = source === "url" && compareWithDocuments;
  const needsDocuments = source === "documents" || comparisonActive;

  function changeSource(next) {
    setSource(next);
    setError("");
  }
  function addFiles(incoming) {
    setError("");
    const selected = Array.from(incoming);
    if (selected.some((file) => !/\.(pdf|docx|txt|md)$/i.test(file.name))) {
      setError("Choose PDF, DOCX, TXT, or Markdown documents.");
      return;
    }
    if (
      selected.some((file) => file.size === 0 || file.size > 10 * 1024 * 1024)
    ) {
      setError(
        "Each document must contain content and be no larger than 10 MB.",
      );
      return;
    }
    const next = [...files];
    for (const file of selected)
      if (
        !next.some(
          (current) =>
            current.name === file.name &&
            current.size === file.size &&
            current.lastModified === file.lastModified,
        )
      )
        next.push(file);
    if (next.length > 5) {
      setError("Attach up to 5 documents per request.");
      return;
    }
    setFiles(next);
  }
  function toggleType(type) {
    setSelectedTypes((current) =>
      current.includes(type)
        ? current.filter((value) => value !== type)
        : [...current, type],
    );
    setError("");
  }
  function review({ configuration, prompt, subject }) {
    setError("");
    if (urlLocked) return;
    if (!workspaceKey) {
      setError("Choose a workspace where you have Editor or Owner access.");
      return;
    }
    if (source === "story" && (!subject || subject.length > 100)) {
      setError("Enter a test / project name up to 100 characters.");
      return;
    }
    if (source === "story" && (!subject || !prompt)) {
      setError("Add a subject and description before reviewing your request.");
      return;
    }
    if (
      !count.trim() ||
      !Number.isSafeInteger(Number(count)) ||
      Number(count) < 1
    ) {
      setError("Enter a whole number of test cases greater than zero.");
      countInput.current?.focus();
      return;
    }
    if (needsDocuments && !files.length) {
      setError(
        comparisonActive
          ? "Attach at least one document to compare with the URL."
          : "Attach at least one document to continue.",
      );
      uploadButton.current?.focus();
      return;
    }
    let targetUrl;
    if (source === "url") {
      try {
        targetUrl = new URL(url.trim());
        if (
          !["http:", "https:"].includes(targetUrl.protocol) ||
          targetUrl.username ||
          targetUrl.password
        )
          throw new Error("Invalid URL");
      } catch {
        setError(
          "Enter a valid HTTP or HTTPS website URL without embedded credentials.",
        );
        urlInput.current?.focus();
        return;
      }
    }
    if (!selectedTypes.length) {
      setError("Select at least one test type.");
      return;
    }
    if (source !== "story") {
      subject =
        project?.name ||
        (source === "url"
          ? targetUrl.hostname
          : files[0].name.replace(/\.[^.]+$/, "")
        )
          .slice(0, 100)
          .trim() ||
        "Document tests";
    }
    setSavedProject(null);
    setProjectDescription(
      source === "story" ? prompt.slice(0, 5000) : project?.description || "",
    );
    setRequest({
      preview: true,
      source,
      workspace: workspaces.find(({ key }) => key === workspaceKey) || null,
      generationMode: { value: GENERATION_MODE.value, label: GENERATION_MODE.label },
      configuration,
      prompt,
      subject,
      description: prompt,
      filters: {
        count: Number(count),
        priority,
        testTypes: [...selectedTypes],
      },
      ...(targetUrl ? { url: targetUrl.href } : {}),
      ...(source === "url" ? { compareWithDocuments } : {}),
      ...(needsDocuments
        ? {
            documents: files.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })),
            documentContentsIncluded: false,
          }
        : {}),
    });
  }
  async function saveProject() {
    if (saving || savedProject || !request?.workspace) return;
    setSaving(true);
    setError("");
    try {
      const saved = await workspaceRequest(
        project
          ? `/projects/${project.id}`
          : workspacePath(request.workspace.key, "/projects"),
        {
          method: project ? "PATCH" : "POST",
          body: JSON.stringify({
            name: request.subject,
            description: projectDescription,
            generationRequest: request,
          }),
        },
      );
      setSavedProject(saved);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }
  function downloadRequest() {
    const address = URL.createObjectURL(
      new Blob([JSON.stringify(request, null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = address;
    link.download = "casefy-generation-request.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(address), 1000);
  }
  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#102019] lg:pl-64">
      <DashboardSidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
        {project && (
          <Link
            to={`/workspaces/${projectWorkspace.key}`}
            className="mb-6 inline-flex min-h-10 items-center rounded-md text-sm font-semibold text-[#294137] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
          >
            Back to projects
          </Link>
        )}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="custom"
              type="button"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
              className="flex size-11 shrink-0 lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </Button>
            <div>
              <Heading
                as="h1"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                {project ? project.name : "Test generator"}
              </Heading>
              <P variant="unstyled" className="mt-2 text-sm leading-6 text-[#526159]">
                {project
                  ? initialRequest
                    ? "Continue writing the test request for this project."
                    : "Write your first test request for this project."
                  : "Turn your requirements into a clear testing plan."}
              </P>
            </div>
          </div>
          {!project && workspaces.length > 0 && (
            <SelectMenu
              id="generator-workspace"
              label="Workspace for this request"
              className="w-full sm:w-60"
              value={workspaceKey}
              onChange={setWorkspaceKey}
              options={workspaces.map((workspace) => ({
                value: workspace.key,
                label: workspace.name,
                description: "Workspace for this request",
              }))}
            />
          )}
        </header>

        <div className="mx-auto mt-8 max-w-6xl">
          {!project && workspaceError && (
            <P variant="unstyled" role="alert" className="mb-4 text-sm text-red-700">
              {workspaceError}
            </P>
          )}
          {project && initialRequest?.documents?.length > 0 && (
            <P variant="unstyled" className="mb-4 rounded-md border border-[#CFDDD5] bg-white p-4 text-sm text-[#526159]">
              Reattach your documents to review a new request. Previously saved
              files:{" "}
              {initialRequest.documents.map(({ name }) => name).join(", ")}.
            </P>
          )}
          {!workspacesLoading && !workspaceError && !workspaces.length && (
            <P variant="unstyled"
              role="status"
              className="mb-4 rounded-md border border-[#CFDDD5] bg-white p-4 text-sm text-[#526159]"
            >
              You need Editor or Owner access to a workspace to save a test
              project.{" "}
              <Link
                to="/settings/workspaces"
                className="font-semibold underline"
              >
                View workspaces
              </Link>
            </P>
          )}
          <div
            className="grid grid-cols-3 gap-1.5 rounded-md border border-[#dce6df] bg-[#eaf0ec] p-1.5"
            role="group"
            aria-label="Requirement source"
          >
            {sources.map(({ value, label, icon: Icon }) => (
              <Button variant="unstyled"
                key={value}
                type="button"
                aria-pressed={source === value}
                onClick={() => changeSource(value)}
                className={`inline-flex min-h-12 cursor-pointer flex-wrap items-center justify-center gap-2 rounded-md px-2 py-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] sm:px-5 sm:text-sm ${source === value ? "bg-white text-[#294137] shadow-sm ring-1 ring-[#cfddd5]" : "text-[#526159] hover:bg-white/60"}`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
                {value === "url" && !urlAllowed && (
                  <LockKeyhole size={12} aria-label="Paid plans" />
                )}
              </Button>
            ))}
          </div>

          {urlLocked ? (
            <div className="mt-4 rounded-md border border-[#CFDDD5] bg-white p-8 text-center sm:p-12">
              <Span variant="accent" className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#edf3ef]">
                <LockKeyhole size={22} aria-hidden="true" />
              </Span>
              <h3 className="mt-5 text-xl font-bold tracking-tight">
                Go beyond requirements with a URL
              </h3>
              <P variant="unstyled" className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#526159]">
                Website URL input is included with Plus, Pro, and Ultra. Your
                Free plan includes user stories and documents.
              </P>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="primary" size="custom"
                  to="/pricing"
                  className="min-h-11 px-5"
                >
                  View plans
                </Button>
                <Button variant="unstyled"
                  type="button"
                  onClick={() => changeSource("story")}
                  className="min-h-11 cursor-pointer rounded-md border border-[#CFDDD5] px-5 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
                >
                  Use a user story
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <ModelSelectorPrompt
                subject={subject}
                onSubjectChange={
                  source === "story"
                    ? (value) => {
                        setSubject(value);
                        setError("");
                      }
                    : undefined
                }
                showPrompt={source === "story"}
                disabled={(!project && workspacesLoading) || !workspaceKey}
                settingsPosition="top"
                configuration={configuration}
                onConfigurationChange={setConfiguration}
                prompt={prompts[source]}
                onPromptChange={(prompt) => {
                  setPrompts((current) => ({ ...current, [source]: prompt }));
                  setError("");
                }}
                onSubmit={review}
                promptRequired={source === "story"}
                promptLabel={
                  source === "story"
                    ? "User story or requirements"
                    : "Additional instructions (optional)"
                }
                placeholder={
                  source === "story"
                    ? "What do you want to test?\n\nAs a user, I want to...\nAdd your acceptance criteria and expected behavior."
                    : "Tell us what to focus on, what to exclude, or any specific behavior to cover."
                }
                settings={
                  <div className="border-b border-[#e1e9e4] px-5 py-3 sm:px-7">
                    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 lg:grid-cols-[6rem_11rem_minmax(0,1fr)]">
                      <div>
                        <label
                          htmlFor="test-count"
                          className="mb-1.5 block text-[11px] font-medium text-[#526159]"
                        >
                          Test cases
                        </label>
                        <input
                          ref={countInput}
                          id="test-count"
                          name="testCount"
                          type="number"
                          inputMode="numeric"
                          min="1"
                          step="1"
                          max={Number.MAX_SAFE_INTEGER}
                          required
                          value={count}
                          onChange={(event) => {
                            setCount(event.target.value);
                            setError("");
                          }}
                          aria-describedby="test-count-hint"
                          className="min-h-9 w-full rounded-md border border-[#CFDDD5] bg-white px-2.5 py-1.5 text-xs text-[#294137] tabular-nums focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]"
                        />
                        <P variant="unstyled" id="test-count-hint" className="sr-only">
                          Enter the number of test cases you need.
                        </P>
                      </div>
                      <div>
                        <label
                          htmlFor="test-priority"
                          className="mb-1.5 block text-[11px] font-medium text-[#526159]"
                        >
                          Priority
                        </label>
                        <SelectMenu
                          id="test-priority"
                          compact
                          label="Priority"
                          value={priority}
                          onChange={setPriority}
                          options={[
                            {
                              value: "all",
                              label: "All priorities",
                              description: "Include every priority level",
                            },
                            {
                              value: "high",
                              label: "High",
                              description: "Critical paths and core behavior",
                            },
                            {
                              value: "medium",
                              label: "Medium",
                              description: "Common workflows and scenarios",
                            },
                            {
                              value: "low",
                              label: "Low",
                              description: "Lower-impact behavior",
                            },
                          ]}
                        />
                      </div>
                      <fieldset className="col-span-2 min-w-0 lg:col-span-1">
                        <legend className="mb-1.5 text-[11px] font-medium text-[#526159]">
                          Test types
                        </legend>
                        <div className="flex flex-wrap gap-1.5">
                          {testTypes.map(({ value, label }) => (
                            <Button variant="unstyled"
                              key={value}
                              type="button"
                              aria-pressed={selectedTypes.includes(value)}
                              onClick={() => toggleType(value)}
                              className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${selectedTypes.includes(value) ? "border-[#294137] bg-[#294137] text-white hover:bg-[#20332b]" : "border-[#dce6df] bg-white text-[#6c8073] hover:border-[#a9bfb0] hover:bg-[#edf3ef]"}`}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>
                }
              >
                {source === "url" && (
                  <div className="flex items-center justify-between gap-4 border-b border-[#e1e9e4] px-5 py-4 sm:px-7">
                    <div>
                      <Span variant="accent"
                        id="compare-documents-label"
                        className="text-sm font-semibold"
                      >
                        Compare with documents
                      </Span>
                      {comparisonActive && (
                        <P variant="unstyled"
                          role="status"
                          className="mt-1 text-xs font-medium text-[#294137]"
                        >
                          Comparison active
                        </P>
                      )}
                    </div>
                    <Button variant="unstyled"
                      type="button"
                      role="switch"
                      aria-labelledby="compare-documents-label"
                      aria-controls="requirement-document-upload"
                      aria-checked={compareWithDocuments}
                      onClick={() => {
                        setCompareWithDocuments((value) => !value);
                        setError("");
                      }}
                      className={`inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] ${compareWithDocuments ? "bg-[#294137]" : "bg-[#b9c9bf]"}`}
                    >
                      <Span
                        aria-hidden="true"
                        className={`size-5 rounded-full bg-white shadow-sm transition-transform ${compareWithDocuments ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </Button>
                  </div>
                )}
                {needsDocuments && (
                  <div
                    id="requirement-document-upload"
                    className="border-b border-[#e1e9e4] p-5 sm:p-7"
                  >
                    <input
                      ref={fileInput}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      multiple
                      tabIndex={-1}
                      aria-label="Choose requirement documents"
                      onChange={(event) => {
                        addFiles(event.target.files);
                        event.target.value = "";
                      }}
                      className="sr-only"
                    />
                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget))
                          setDragging(false);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        addFiles(event.dataTransfer.files);
                      }}
                      className={`rounded-md border border-dashed px-5 py-7 text-center transition-colors ${dragging ? "border-[#294137] bg-[#e2ece6]" : "border-[#afc4b7] bg-[#f6f8f7]"}`}
                    >
                      <UploadCloud
                        size={25}
                        aria-hidden="true"
                        className="mx-auto mb-3 text-[#526159]"
                      />
                      <P variant="unstyled" className="text-sm font-semibold text-[#294137]">
                        {comparisonActive
                          ? "Drop documents to compare with the URL"
                          : "Drop your requirements here"}
                      </P>
                      <P variant="unstyled" className="mt-1.5 text-xs leading-5 text-[#7c8c82]">
                        PDF, DOCX, TXT, or Markdown · Up to 5 files, 10 MB each
                      </P>
                      <Button variant="outline" size="custom"
                        ref={uploadButton}
                        type="button"
                        onClick={() => fileInput.current.click()}
                        className="mt-4 min-h-10 px-4 text-xs"
                      >
                        Browse documents
                      </Button>
                    </div>
                    {files.length > 0 && (
                      <ul
                        aria-label="Attached documents"
                        className="mt-4 space-y-2"
                      >
                        {files.map((file, index) => (
                          <li
                            key={`${file.name}-${file.lastModified}-${file.size}`}
                            className="flex items-center gap-3 rounded-md border border-[#dce6df] px-3 py-2"
                          >
                            <FileText
                              size={17}
                              aria-hidden="true"
                              className="shrink-0 text-[#526159]"
                            />
                            <Span className="min-w-0 flex-1">
                              <Span
                                className="block truncate text-sm font-medium"
                                title={file.name}
                              >
                                {file.name}
                              </Span>
                              <Span className="text-xs text-[#7c8c82]">
                                {formatSize(file.size)}
                              </Span>
                            </Span>
                            <Button variant="unstyled"
                              type="button"
                              aria-label={`Remove ${file.name}`}
                              onClick={() =>
                                setFiles((current) =>
                                  current.filter((_, at) => at !== index),
                                )
                              }
                              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#526159] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
                            >
                              <X size={16} aria-hidden="true" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {source === "url" && (
                  <div className="border-b border-[#e1e9e4] p-5 sm:p-7">
                    <label
                      htmlFor="website-url"
                      className="text-sm font-semibold text-[#294137]"
                    >
                      URL
                    </label>
                    <div className="relative mt-3">
                      <Globe
                        size={18}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-3.5 left-3.5 text-[#7c8c82]"
                      />
                      <input
                        ref={urlInput}
                        id="website-url"
                        name="websiteUrl"
                        type="url"
                        placeholder="https://your-app.com"
                        required
                        value={url}
                        onChange={(event) => {
                          setUrl(event.target.value);
                          setError("");
                        }}
                        className={`${inputClass} pl-11`}
                      />
                    </div>
                    <P variant="unstyled" className="mt-2 text-xs leading-5 text-[#7c8c82]">
                      Add the page you want to cover. This preview does not
                      visit the website.
                    </P>
                  </div>
                )}
              </ModelSelectorPrompt>
            </div>
          )}

          {error && (
            <P variant="unstyled"
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </P>
          )}
        </div>

        {request && (
          <AccountModal
            title="Review generation request"
            busy={saving}
            onDismiss={() => setRequest(null)}
          >
            <P variant="unstyled" className="mb-5 rounded-md bg-[#edf3ef] p-3 text-xs leading-5 text-[#526159]">
              This is a request preview. No AI request has been sent and no
              credits have been used.
            </P>
            {savedProject ? (
              <P variant="unstyled"
                role="status"
                className="mb-5 rounded-md bg-[#edf3ef] p-3 text-sm text-[#294137]"
              >
                {project
                  ? "Test request saved to this project."
                  : `Project saved to ${request.workspace.name}.`}
              </P>
            ) : request.source === "story" ? (
              <label className="mb-5 block text-sm font-medium">
                Project description
                <textarea
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  maxLength={5000}
                  rows={3}
                  disabled={saving}
                  className={`${inputClass} mt-2`}
                />
                <Span className="mt-2 block text-xs font-normal text-[#526159]">
                  {project
                    ? "Saving updates this project with the reviewed request."
                    : `Saving creates a project named “${request.subject}” with this reviewed request.`}
                </Span>
              </label>
            ) : null}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm">
              {[
                [
                  "Source",
                  sources.find(({ value }) => value === request.source)?.label,
                ],
                ["Workspace", request.workspace?.name || "Not selected"],
                ...(request.source === "url"
                  ? [
                      [
                        "Document comparison",
                        request.compareWithDocuments ? "Active" : "Off",
                      ],
                    ]
                  : []),
                ["Generation mode", request.generationMode.label],
                ["Test cases", request.filters.count],
                [
                  "Priority",
                  request.filters.priority === "all"
                    ? "All priorities"
                    : request.filters.priority,
                ],
                ["Output detail", request.configuration.detail],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-[#7c8c82]">{label}</dt>
                  <dd className="mt-1 break-words font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <P variant="unstyled" className="mt-5 text-xs text-[#7c8c82]">Test types</P>
            <P variant="unstyled" className="mt-1 text-sm leading-6">
              {request.filters.testTypes
                .map(
                  (value) =>
                    testTypes.find((type) => type.value === value)?.label,
                )
                .join(", ")}
            </P>
            {request.url && (
              <>
                <P variant="unstyled" className="mt-5 text-xs text-[#7c8c82]">URL</P>
                <P variant="unstyled" className="mt-1 break-all text-sm">{request.url}</P>
              </>
            )}
            {request.documents && (
              <>
                <P variant="unstyled" className="mt-5 text-xs text-[#7c8c82]">Documents</P>
                <ul className="mt-2 space-y-1 text-sm">
                  {request.documents.map((file) => (
                    <li key={file.name} className="break-words">
                      {file.name} · {formatSize(file.size)}
                    </li>
                  ))}
                </ul>
                <P variant="unstyled" className="mt-2 text-xs leading-5 text-[#7c8c82]">
                  The downloaded request includes file names and sizes, without
                  document contents.
                </P>
              </>
            )}
            {request.subject && (
              <>
                <P variant="unstyled" className="mt-5 text-xs text-[#7c8c82]">Subject</P>
                <P variant="unstyled" className="mt-1 break-words text-sm font-medium">
                  {request.subject}
                </P>
              </>
            )}
            {request.prompt && (
              <>
                <P variant="unstyled" className="mt-5 text-xs text-[#7c8c82]">
                  {request.subject
                    ? "Description"
                    : "Requirements / instructions"}
                </P>
                <P variant="unstyled" className="mt-2 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-[#f6f8f7] p-4 text-sm leading-6">
                  {request.prompt}
                </P>
              </>
            )}
            {error && (
              <P variant="unstyled"
                role="alert"
                className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800"
              >
                {error}
              </P>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="unstyled"
                type="button"
                onClick={downloadRequest}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-[#CFDDD5] px-4 text-sm font-semibold text-[#294137] hover:bg-[#edf3ef] focus-visible:outline-2 focus-visible:outline-[#294137]"
              >
                <Download size={16} aria-hidden="true" />
                Download request
              </Button>
              {savedProject ? (
                <Button variant="primary" size="custom"
                  to={`/workspaces/${request.workspace.key}`}
                  className="min-h-11 px-5"
                >
                  View project in workspace
                </Button>
              ) : (
                <Button variant="primary" size="custom"
                  type="button"
                  onClick={saveProject}
                  disabled={saving}
                  className="min-h-11 px-5"
                >
                  {saving
                    ? "Saving..."
                    : project
                      ? "Save to project"
                      : "Save as project"}
                </Button>
              )}
            </div>
          </AccountModal>
        )}
      </main>
    </div>
  );
}
