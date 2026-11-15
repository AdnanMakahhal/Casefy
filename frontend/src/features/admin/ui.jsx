import { panel, input } from "./styles";
import { MessageSquare, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { titleCase } from "../../lib/format";

export function Loading() {
  return (
    <div role="status" aria-busy="true" className={`${panel} space-y-5 p-6`}>
      <span className="sr-only">Loading section...</span>
      <div aria-hidden="true" className="space-y-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg bg-[#edf3ef] motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}

export function Empty({ text = "No records to show yet." }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[#526159]">
      <MessageSquare size={25} />
      <p>{text}</p>
    </div>
  );
}

export function ErrorMessage({ children }) {
  return children ? (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {children}
    </p>
  ) : null;
}

export function Badge({ value }) {
  return (
    <span
      className={`staff-badge ${["failed", "blocked", "canceled"].includes(value) ? "negative" : ["completed", "sent", "active", "succeeded", "resolved"].includes(value) ? "positive" : ""}`}
    >
      {titleCase(value || "No subscription")}
    </span>
  );
}

export function Pagination({ data, onChange }) {
  return (
    <footer className="admin-pagination">
      <span>
        {data.total
          ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)}`
          : "0"}{" "}
        of {data.total}
      </span>
      <div>
        <button
          className="admin-icon-button"
          aria-label="Previous page"
          disabled={data.page <= 1}
          onClick={() => onChange(data.page - 1)}
        >
          <ChevronLeft size={18} />
        </button>
        <span>Page {data.page}</span>
        <button
          className="admin-icon-button"
          aria-label="Next page"
          disabled={data.page * data.pageSize >= data.total}
          onClick={() => onChange(data.page + 1)}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </footer>
  );
}

export function SearchForm({ onSearch, placeholder = "Search name or email..." }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(event.currentTarget.elements.search.value.trim());
      }}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <div className="relative min-w-0 flex-1">
        <Search size={17} className="pointer-events-none absolute top-3.5 left-3 text-[#718578]" />
        <input
          name="search"
          aria-label={placeholder}
          placeholder={placeholder}
          className={`${input} pl-10`}
        />
      </div>
      <button className="admin-button">Search</button>
    </form>
  );
}
