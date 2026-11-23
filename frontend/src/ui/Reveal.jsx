import { motion as Motion, useReducedMotion } from "motion/react";

const elements = {
  div: Motion.div,
  header: Motion.header,
  section: Motion.section,
  article: Motion.article,
  figure: Motion.figure,
  li: Motion.li,
};

/** Landing-page reveal motion without adding an extra layout wrapper. */
export default function Reveal({
  as = "div",
  delay = 0,
  disabled = false,
  children,
  ...props
}) {
  const reducedMotion = useReducedMotion();
  const Element = elements[as] || elements.div;
  const staticContent = Boolean(reducedMotion || disabled);

  return (
    <Element
      {...props}
      initial={staticContent ? false : { opacity: 0, y: 50 }}
      animate={staticContent ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: staticContent ? 0 : 0.6,
        delay: staticContent ? 0 : delay,
        ease: "easeOut",
      }}
    >
      {children}
    </Element>
  );
}
