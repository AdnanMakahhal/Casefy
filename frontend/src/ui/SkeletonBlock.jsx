import Span from "./Span";
export default function SkeletonBlock({ className = "", dark = false, ...props }) {
  return (
    <Span
      {...props}
      aria-hidden="true"
      className={`block animate-pulse rounded-md motion-reduce:animate-none ${dark ? "bg-white/15" : "bg-[#e5ece7]"} ${className}`}
    />
  );
}
