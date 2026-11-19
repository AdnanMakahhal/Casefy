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
    <span key="heading-ending">
      {match[1]}<span className="site-heading-accent">{match[2]}</span>{match[3]}
    </span>
  );
  return parts;
}

export default function Heading({ as = "h2", children, className = "", ...props }) {
  const reducedMotion = useReducedMotion();
  const Element = elements[as] || elements.h2;
  const largeTitle = className.includes("text-4xl") && className.includes("sm:text-5xl");
  return (
    <Element
      {...props}
      initial={reducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`site-heading ${largeTitle ? "site-heading--hero" : ""} ${className}`}
    >
      <span className="site-heading-text">{accentTitle(children)}</span>
      <span aria-hidden="true" className="site-heading-line" />
    </Element>
  );
}
