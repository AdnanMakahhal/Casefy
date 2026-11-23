import { twMerge } from "tailwind-merge";

export default function H1({
  children,
  className = "",
  variant = "default",
  ...props
}) {
  const styles =
    variant === "unstyled"
      ? ""
      : variant === "hero"
        ? "text-4xl font-extrabold tracking-tight leading-[1.12] sm:text-5xl"
        : "text-3xl font-extrabold tracking-tight sm:text-4xl";
  return (
    <h1 {...props} className={twMerge(styles, className)}>
      {children}
    </h1>
  );
}
