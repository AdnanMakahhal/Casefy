import useReportData from "./useReportData";
import { titleCase, displayDate } from "../../lib/format";
import AccountModal from "../../components/AccountModal";
import { Loading, ErrorMessage, Empty, Badge, Pagination } from "../admin/ui";
import GenerationResults from "../test-generation/GenerationResults";
import { useState } from "react";
import { panel } from "../admin/styles";
import { ArrowUpRight } from "lucide-react";

function ReportDetail({ id, onClose }) {
  const { data, loading, error } = useReportData(`/reports/${id}`);
  return (
    <AccountModal title={`Generation report #${id}`} onDismiss={onClose}>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <GenerationResults run={data.run} />
      )}
    </AccountModal>
  );
}

export default function ReportsSection({ revision = 0 }) {
  const [page, setPage] = useState(1),
    [selected, setSelected] = useState(null);
  const { data, loading, error } = useReportData(
    `/reports?page=${page}`,
    revision,
  );
  if (loading) return <Loading />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  const completed = data.summary.find((item) => item.status === "completed");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Generation runs", data.total],
          ["Completed runs", completed?._count._all || 0],
          ["Generated test cases", completed?._sum.testCount || 0],
        ].map(([name, count]) => (
          <article key={name} className={`${panel} p-5`}>
            <h2 className="text-sm font-semibold text-[#526159]">{name}</h2>
            <p className="mt-4 text-3xl font-extrabold">
              {count.toLocaleString()}
            </p>
          </article>
        ))}
      </div>
      <section className={`${panel} overflow-hidden`}>
        <header className="admin-panel-header">
          <div>
            <h2>Generation history</h2>
            <p>
              Saved AI generation results. These are not execution or pass-rate
              reports.
            </p>
          </div>
        </header>
        {!data.runs.length ? (
          <Empty text="Generate test cases to see your first report here." />
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>User</th>
                  <th>Model</th>
                  <th>Cases</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <strong className="block max-w-52 truncate">
                        {run.subject}
                      </strong>
                      <span className="mt-1 block text-xs text-[#718578]">
                        #{run.id} · {titleCase(run.source)}
                      </span>
                    </td>
                    <td>{run.user.name}</td>
                    <td>{run.model}</td>
                    <td>
                      {run.testCount} / {run.requestedCount}
                    </td>
                    <td>
                      <Badge value={run.status} />
                    </td>
                    <td>{displayDate(run.createdAt)}</td>
                    <td>
                      <button
                        className="admin-icon-button"
                        aria-label={`Open report ${run.id}`}
                        onClick={() => setSelected(run.id)}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination data={data} onChange={setPage} />
      </section>
      {selected && (
        <ReportDetail
          id={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
