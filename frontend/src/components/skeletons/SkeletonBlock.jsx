export default function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-[#e5ece7] motion-reduce:animate-none ${className}`}
    />
  );
}
