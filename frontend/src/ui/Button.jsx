import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";

const base = "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 motion-reduce:transition-none";
const variants = {
  primary: "bg-[#294137] text-white [&:not(:disabled):not([aria-disabled=true]):hover]:bg-[#20332b]",
  outline: "border border-[#CFDDD5] bg-white text-[#294137] [&:not(:disabled):not([aria-disabled=true]):hover]:bg-[#edf3ef]",
  secondary: "border border-[#CFDDD5] bg-[#edf3ef] text-[#14231c] [&:not(:disabled):not([aria-disabled=true]):hover]:bg-[#e2ece6]",
  danger: "bg-red-700 text-white focus-visible:outline-red-700 [&:not(:disabled):not([aria-disabled=true]):hover]:bg-red-800",
  ghost: "text-[#294137] [&:not(:disabled):not([aria-disabled=true]):hover]:bg-[#edf3ef]",
};
const sizes = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2",
  lg: "min-h-12 px-6 py-3 text-base",
  icon: "size-10 shrink-0 p-0",
  custom: "",
};

/**
 * Shared actions. Use `to` for navigation and `type="submit"` for forms.
 * `size="custom"` keeps shared styling with caller-controlled spacing.
 * `variant="unstyled"` preserves specialized controls such as menu triggers.
 */

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  to,
  href,
  disabled = false,
  loading = false,
  onClick,
  ...props
}) {
  const unavailable = disabled || loading;
  const classes = twMerge(
    variant === "unstyled" ? "" : [base, variants[variant], sizes[size]].filter(Boolean).join(" "),
    className,
  );

  if (to !== undefined || href !== undefined) {
    const navigation = {
      ...props,
      className: classes,
      "aria-disabled": unavailable || undefined,
      "aria-busy": loading || undefined,
      tabIndex: unavailable ? -1 : props.tabIndex,
      onClick: (event) => {
        if (unavailable) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      },
    };

    return to !== undefined ? (
      <Link {...navigation} to={unavailable ? "#" : to}>
        {children}
      </Link>
    ) : (
      <a {...navigation} href={unavailable ? undefined : href}>
        {children}
      </a>
    );
  }

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={unavailable}
      aria-busy={loading || undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
