import P from "../../ui/P";
import Span from "../../ui/Span";
import Button from "../../ui/Button";
import { panel, input } from "./styles";
import {
  RiChat1Line as MessageSquare,
  RiArrowLeftSLine as ChevronLeft,
  RiArrowRightSLine as ChevronRight,
  RiSearchLine as Search,
} from "react-icons/ri";
import { titleCase } from "../../lib/format";
import { useEffect, useRef, useState } from "react";

export function Loading() {
  return (
    <div role="status" aria-busy="true" className={`${panel} space-y-5 p-6`}>
      <Span className="sr-only">Loading section...</Span>
      <div aria-hidden="true" className="space-y-5">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-md bg-[#edf3ef] motion-reduce:animate-none"
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
      <P variant="unstyled">{text}</P>
    </div>
  );
}

export function ErrorMessage({ children }) {
  return children ? (
    <P variant="unstyled"
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      {children}
    </P>
  ) : null;
}

export function Badge({ value }) {
  return (
    <Span
      className={`staff-badge ${["failed", "blocked", "canceled"].includes(value) ? "negative" : ["completed", "sent", "active", "succeeded", "resolved"].includes(value) ? "positive" : ""}`}
    >
      {value === "resolved" ? "Closed" : titleCase(value || "No subscription")}
    </Span>
  );
}

function pageNumbers(page, totalPages) {
  if (totalPages <= 7)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  const wanted = [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const output = [];
  let previous = 0;
  for (const value of wanted) {
    if (previous && value - previous > 1) output.push(`gap-${value}`);
    output.push(value);
    previous = value;
  }
  return output;
}

export function Pagination({ data, onChange, label = "records" }) {
  const pageSize = data.pageSize || 10;
  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const page = Math.min(Math.max(1, data.page || 1), totalPages);
  const start = data.total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, data.total);
  return (
    <footer className="admin-pagination">
      <Span className="admin-pagination-summary">
        {data.total
          ? `Showing ${start}–${end} of ${data.total.toLocaleString("en-US")} ${label}`
          : `No ${label}`}
      </Span>
      <nav className="admin-pagination-pages" aria-label="Pagination">
        <Button variant="unstyled"
          type="button"
          className="admin-icon-button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={18} />
        </Button>
        <Span className="admin-page-numbers">
          {pageNumbers(page, totalPages).map((value) =>
            typeof value === "number" ? (
              <Button variant="unstyled"
                key={value}
                type="button"
                className={`admin-page-number${value === page ? " is-current" : ""}`}
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
                onClick={() => onChange(value)}
              >
                {value}
              </Button>
            ) : (
              <Span key={value} className="admin-page-gap" aria-hidden="true">
                …
              </Span>
            ),
          )}
        </Span>
        <Button variant="unstyled"
          type="button"
          className="admin-icon-button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={18} />
        </Button>
      </nav>
    </footer>
  );
}

export function SearchForm({
  onSearch,
  placeholder = "Search name or email...",
  liveSearch = false,
  value = "",
}) {
  const [draft, setDraft] = useState({ value, query: value });
  if (draft.value !== value) setDraft({ value, query: value });
  const query = draft.value === value ? draft.query : value;
  const searchTimer = useRef(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, [value]);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  function submit(event) {
    event.preventDefault();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    onSearch(query.trim());
  }

  function changeQuery(event) {
    const nextQuery = event.target.value;
    setDraft({ value, query: nextQuery });
    if (!liveSearch) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => onSearch(nextQuery.trim()), 300);
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-1 items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          size={17}
          className="pointer-events-none absolute top-3.5 left-3 text-[#718578]"
        />
        <input
          name="search"
          type="search"
          value={query}
          onChange={changeQuery}
          aria-label={placeholder}
          placeholder={placeholder}
          className={`${input} pl-10`}
        />
      </div>
      {!liveSearch && <Button variant="outline" size="md" type="submit" className="border px-5 py-2.5 whitespace-nowrap">Search</Button>}
    </form>
  );
}
