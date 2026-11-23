import Reveal from "../ui/Reveal";
import H2 from "../ui/H2";
import P from "../ui/P";
import Span from "../ui/Span";
import { useId, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import {
  RiCheckLine as Check,
  RiCodeSSlashLine as Code2,
  RiGlobalLine as Globe2,
  RiFileSearchLine as ScanSearch,
  RiSparklingLine as Sparkles,
} from "react-icons/ri";
import Button from "../ui/Button";

const examples = {
  Playwright: `import { test, expect } from '@playwright/test';

test('Checkout flow', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByTestId('cart-total'))
    .toHaveText('$149.99');
});`,
  Cypress: `describe('Checkout flow', () => {
  it('shows the correct total', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="cart-total"]')
      .should('have.text', '$149.99');
  });
});`,
  Selenium: `from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver.get('https://example.com/checkout')
WebDriverWait(driver, 10).until(EC.text_to_be_present_in_element(
    (By.CSS_SELECTOR, '[data-testid="cart-total"]'), '$149.99'
))`,
};

const cardClass = "min-w-0 rounded-md border border-[#CFDDD5] bg-white p-5 sm:p-8";
const iconClass = "mb-6 flex size-12 items-center justify-center rounded-md bg-[#294137] text-white";

export default function PrecisionQA() {
  const [framework, setFramework] = useState("Playwright");
  const highlightId = useId();
  const reducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="precision-heading" className="mx-auto mt-20 max-w-[1040px] pb-10 text-left sm:mt-28">
      <Reveal className="mx-auto mb-10 max-w-[700px] text-center sm:mb-12">
        <H2 variant="unstyled" id="precision-heading" className="text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl">
          Engineered for precision QA
        </H2>
        <P variant="unstyled" className="mt-6 text-base leading-6 font-medium text-[#526159]">
          From requirements to ready-to-run tests. One focused workflow.
        </P>
      </Reveal>
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        <Reveal as="article" delay={0.0}  className={`${cardClass} flex flex-col`}>
          <div className={iconClass}><Sparkles size={22} aria-hidden="true" /></div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[#102019]">AI requirement analysis</h3>
          <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
            Turn Jira tickets, PRDs, and raw text into testing criteria. Find the edge cases before they become bugs.
          </P>
          <div className="mt-7 flex-1 rounded-md border border-[#CFDDD5] bg-[#f6f8f7] p-5">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#CFDDD5] pb-3 text-xs font-semibold text-[#526159]">
              <Span>requirements.md</Span>
              <Span variant="accent" className="rounded-md bg-[#e2ece6] px-2.5 py-1">Example analysis</Span>
            </div>
            <ul className="space-y-3 text-sm text-[#294137]">
              {["Requirements analyzed", "14 test scenarios identified", "3 edge cases discovered", "Ready for test generation"].map((step) => (
                <li key={step} className="flex items-center gap-2.5">
                  <Check size={16} className="shrink-0" aria-hidden="true" />{step}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal as="article" delay={0.1}  className={`${cardClass} flex flex-col`}>
          <div className={iconClass}><ScanSearch size={22} aria-hidden="true" /></div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[#102019]">Live exploration</h3>
          <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
            Start with a URL. Explore page structure and user journeys to uncover what needs testing across your web application.
          </P>
          <div className="mt-7 flex flex-1 flex-col rounded-md border border-[#CFDDD5] bg-[#f6f8f7]">
            <div className="flex items-center gap-2 border-b border-[#CFDDD5] px-4 py-3 text-xs font-medium text-[#526159]">
              <Globe2 size={14} aria-hidden="true" /><Span>your-app.com / checkout</Span>
            </div>
            <div className="flex flex-1 items-center gap-4 p-5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#CFDDD5] bg-[#edf3ef] text-[#294137]">
                <Globe2 size={27} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 space-y-2.5" aria-hidden="true">
                <div className="h-2.5 w-3/4 rounded-full bg-[#CFDDD5]" />
                <div className="h-2.5 w-full rounded-full bg-[#e2ece6]" />
                <div className="h-2.5 w-1/2 rounded-full bg-[#e2ece6]" />
              </div>
            </div>
            <P variant="unstyled" className="px-5 pb-5 text-xs font-medium text-[#526159]">Page structure. User flows. Potential regressions.</P>
          </div>
        </Reveal>
        <Reveal as="article" delay={0.2}

          aria-labelledby="automated-generation-heading"
          className={`${cardClass} grid items-start gap-7 md:col-span-2 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10`}
        >
          <div className="min-w-0">
            <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-[#294137] text-white sm:mb-6 sm:size-12"><Code2 size={22} aria-hidden="true" /></div>
            <H2 id="automated-generation-heading" className="font-heading text-xl leading-tight text-[#102019] sm:text-2xl">
              Automated test generation
            </H2>
            <P variant="unstyled" className="mt-3 text-sm leading-6 text-[#526159]">
              Take your test cases into the tools you already use. Preview an example in your preferred framework.
            </P>
            <div className="mt-5 grid w-full min-w-0 grid-cols-3 gap-1 rounded-md border border-[#CFDDD5] bg-[#edf3ef] p-1 sm:mt-6" role="group" aria-label="Preview framework">
              {Object.keys(examples).map((name) => (
                <Button
                  key={name}
                  variant="unstyled"
                  size="custom"
                  aria-pressed={framework === name}
                  aria-controls="framework-code-preview"
                  onClick={() => setFramework(name)}
                  className={`relative isolate flex min-h-11 min-w-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137] motion-reduce:transition-none sm:px-2 sm:text-sm ${framework === name ? "text-white" : "text-[#526159] hover:text-[#294137]"}`}
                >
                  {framework === name && <Motion.span aria-hidden="true" layoutId={highlightId} initial={false} className="absolute inset-0 -z-10 rounded-md border border-[#294137] bg-[#294137] shadow-sm" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }} />}
                  <Span className="relative">{name}</Span>
                </Button>
              ))}
            </div>
          </div>
          <div id="framework-code-preview" className="w-full min-w-0 max-w-full overflow-hidden rounded-md border border-[#CFDDD5] bg-[#f6f8f7]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CFDDD5] bg-[#edf3ef] px-4 py-3 sm:px-5">
              <Span className="inline-flex items-center gap-2 text-xs font-semibold text-[#294137]">
                <Code2 size={16} aria-hidden="true" />
                {framework} example
              </Span>
              <Span className="rounded-md border border-[#CFDDD5] bg-white px-2.5 py-1 text-[10px] font-medium text-[#526159]">
                Checkout flow
              </Span>
            </div>
            <pre tabIndex={0} aria-label={`${framework} example code`} className="min-h-[200px] w-full max-w-full overflow-x-auto overscroll-x-contain p-3 font-mono text-[11px] leading-6 text-[#294137] selection:bg-[#CFDDD5] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137] sm:min-h-[230px] sm:p-5 sm:text-xs">
              <AnimatePresence initial={false} mode="wait">
                <Motion.code key={framework} className="block" initial={reducedMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -5 }} transition={{ duration: reducedMotion ? 0 : 0.14, ease: "easeOut" }}>{examples[framework]}</Motion.code>
              </AnimatePresence>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
