import { Link } from "react-router-dom";
import useCredits from "../features/authentication/useCredits";
import SkeletonBlock from "./skeletons/SkeletonBlock";

export default function SidebarCredits({ user, onClose }) {
  const { data, loading, error } = useCredits(user.id);

  if (loading)
    return (
      <div
        role="status"
        aria-busy="true"
        className="mt-6 rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-3"
      >
        <span className="sr-only">Loading credit balance...</span>
        <div aria-hidden="true">
          <div className="flex items-center justify-between gap-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-3 w-14" />
          </div>
          <SkeletonBlock className="mt-3 h-7 w-28" />
          <SkeletonBlock className="mt-3 h-1.5 w-full rounded-full" />
        </div>
      </div>
    );

  return (
    <Link
      to="/settings#credits"
      onClick={onClose}
      className="mt-6 block rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#526159]">
          Credits remaining
        </span>
        <span className="text-[10px] text-[#526159]">View usage</span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums text-[#294137]">
        {error ? "Unavailable" : data.balance.toLocaleString()}
        {data && (
          <span className="ml-1 text-xs font-normal text-[#526159]">
            / {data.allowance.toLocaleString()}
          </span>
        )}
      </p>
      {data && (
        <progress
          aria-label="Credits remaining"
          max={Math.max(data.allowance, data.balance, 1)}
          value={data.balance}
          className="mt-2 h-1.5 w-full accent-[#294137]"
        />
      )}
    </Link>
  );
}
