import { twMerge } from "tailwind-merge";

const variants = {
  muted: "text-[#718578]",
  accent: "text-[#294137]",
  label: "text-xs font-semibold tracking-wide uppercase",
};

export default function Span({
  children,
  className = "",
  variant = "inherit",
  ...props
}) {
  const styles = variants[variant] || "";
  return (
    <span {...props} className={twMerge(styles, className)}>
      {children}
    </span>
  );
}
