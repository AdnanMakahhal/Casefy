import Span from "./Span";
import { twMerge } from "tailwind-merge";
import { Children } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";

const elements = {
  h1: Motion.h1,
  h2: Motion.h2,
  h3: Motion.h3,
  h4: Motion.h4,
  h5: Motion.h5,
  h6: Motion.h6,
};

function accentTitle(children) {
  const parts = Children.toArray(children);
  const last = parts.length - 1;
  if (typeof parts[last] !== "string") return children;
  const match = parts[last].match(/^(.*?)(\S+)(\s*)$/s);
  if (!match) return children;
  parts[last] = (
    <Span key="heading-ending">
      {match[1]}
      <Span className="text-[color:var(--heading-accent)]">{match[2]}</Span>
      {match[3]}
    </Span>
  );
  return parts;
}

export default function Heading({
  as = "h2",
  children,
  className = "",
  ...props
}) {
  const reducedMotion = useReducedMotion();
  const Element = elements[as] || elements.h2;
  const largeTitle =
    className.includes("text-4xl") && className.includes("sm:text-5xl");
  const layoutClasses = className.split(/\s+/).filter((name) =>
    !/^(?:(?:sm|md|lg|xl|2xl):)?text-(?:xs|sm|base|lg|xl|[2-9]xl)$/.test(name),
  ).join(" ");
  return (
    <Element
      {...props}
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={twMerge(
        layoutClasses,
        '[font-family:var(--font-alexandria,_"Alexandria_Variable",_sans-serif)] font-bold tracking-[-0.035em] leading-[1.2] uppercase [text-shadow:0_0_20px_var(--heading-glow)] [overflow-wrap:anywhere] text-balance [&:lang(ar)]:tracking-normal [&:lang(ur)]:tracking-normal',
        largeTitle ? "text-[length:clamp(1.875rem,_3.5vw,_2.75rem)]" : "text-[length:clamp(1.5rem,_2.5vw,_2rem)]",
      )}
    >
      <Span className="opacity-[0.82]">{accentTitle(children)}</Span>
      <Span aria-hidden="true" className={twMerge("block w-[min(4rem,_3em)] h-[0.15rem] mt-[0.3em] rounded-full [background:var(--heading-line)] opacity-[0.65] [box-shadow:0_0_10px_rgb(76_120_93_/_35%)] [.text-center_&]:mx-auto", className.split(/\s+/).includes("mx-auto") ? "mx-auto" : "")} />
    </Element>
  );
}
