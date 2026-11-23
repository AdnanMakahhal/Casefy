import { twMerge } from "tailwind-merge";

export default function H2({
  children,
  className = "",
  variant = "default",
  ...props
}) {
  const styles =
    variant === "unstyled"
      ? ""
      : variant === "compact"
        ? "text-lg font-bold tracking-tight"
        : "text-2xl font-extrabold tracking-tight";
  return (
    <h2 {...props} className={twMerge(styles, className)}>
      {children}
    </h2>
  );
}
