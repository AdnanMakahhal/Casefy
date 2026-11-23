import { twMerge } from "tailwind-merge";

const variants = {
  body: "text-sm leading-7 text-[#526159]",
  lead: "text-base leading-7 font-medium text-[#526159]",
  muted: "text-xs leading-6 text-[#718578]",
};

export default function P({
  children,
  className = "",
  variant = "body",
  ...props
}) {
  const styles = variants[variant] || "";
  return (
    <p {...props} className={twMerge(styles, className)}>
      {children}
    </p>
  );
}
