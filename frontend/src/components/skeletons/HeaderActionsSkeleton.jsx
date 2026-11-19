import SkeletonBlock from "./SkeletonBlock";

export default function HeaderActionsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading account controls"
      className="flex items-center"
    >
      <div aria-hidden="true" className="hidden items-center gap-2 lg:flex">
        <SkeletonBlock className="h-10 w-20" />
        <SkeletonBlock className="h-10 w-20" />
      </div>
      <SkeletonBlock className="size-10 rounded-full lg:hidden" />
    </div>
  );
}
