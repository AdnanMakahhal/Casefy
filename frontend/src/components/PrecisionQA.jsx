import { useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";
import { Check, Code2, Globe2, ScanSearch, Sparkles } from "lucide-react";

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

const cardClass =
  "min-w-0 rounded-2xl border border-[#CFDDD5] bg-white p-6 sm:p-8";
const iconClass =
  "mb-6 flex size-12 items-center justify-center rounded-xl bg-[#294137] text-white";

function PrecisionQA() {
  const [framework, setFramework] = useState("Playwright");
  const reduceMotion = useReducedMotion();
  const reveal = (index) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: {
      duration: reduceMotion ? 0 : 0.6,
      delay: reduceMotion ? 0 : index * 0.42,
      ease: "easeOut",
    },
  });

  return (
    <section
      aria-labelledby="precision-heading"
      className="mx-auto mt-20 max-w-[1040px] pb-10 text-left sm:mt-28"
    >
      <div className="mx-auto mb-10 max-w-[700px] text-center sm:mb-12">
        <h2
          id="precision-heading"
          className="text-4xl leading-[1.12] font-extrabold tracking-tight text-[#102019] sm:text-5xl"
        >
          Engineered for precision QA
        </h2>
        <p className="mt-6 text-base leading-6 font-medium text-[#526159]">
          From requirements to ready-to-run tests. One focused workflow.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 sm:gap-6">
        <Motion.article {...reveal(0)} className={`${cardClass} flex flex-col`}>
          <div className={iconClass}>
            <Sparkles size={22} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[#102019]">
            AI requirement analysis
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#526159]">
            Turn Jira tickets, PRDs, and raw text into testing criteria. Find
            the edge cases before they become bugs.
          </p>
          <div className="mt-7 flex-1 rounded-xl border border-[#CFDDD5] bg-[#f6f8f7] p-5">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-[#CFDDD5] pb-3 text-xs font-semibold text-[#526159]">
              <span>requirements.md</span>
              <span className="rounded-full bg-[#e2ece6] px-2.5 py-1 text-[#294137]">
                Example analysis
              </span>
            </div>
            <ul className="space-y-3 text-sm text-[#294137]">
              {[
                "Requirements analyzed",
                "14 test scenarios identified",
                "3 edge cases discovered",
                "Ready for test generation",
              ].map((step) => (
                <li key={step} className="flex items-center gap-2.5">
                  <Check size={16} className="shrink-0" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </Motion.article>

        <Motion.article {...reveal(1)} className={`${cardClass} flex flex-col`}>
          <div className={iconClass}>
            <ScanSearch size={22} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[#102019]">
            Live exploration
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#526159]">
            Start with a URL. Explore page structure and user journeys to
            uncover what needs testing across your web application.
          </p>
          <div className="mt-7 flex flex-1 flex-col rounded-xl border border-[#CFDDD5] bg-[#f6f8f7]">
            <div className="flex items-center gap-2 border-b border-[#CFDDD5] px-4 py-3 text-xs font-medium text-[#526159]">
              <Globe2 size={14} aria-hidden="true" />
              <span>your-app.com / checkout</span>
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
            <p className="px-5 pb-5 text-xs font-medium text-[#526159]">
              Page structure. User flows. Potential regressions.
            </p>
          </div>
        </Motion.article>

        <Motion.article
          {...reveal(2)}
          className={`${cardClass} grid gap-7 md:col-span-2 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10`}
        >
          <div>
            <div className={iconClass}>
              <Code2 size={22} aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight text-[#102019]">
              Automated test generation
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#526159]">
              Take your test cases into the tools you already use. Preview an
              example in your preferred framework.
            </p>
            <div
              className="mt-6 flex flex-wrap gap-2"
              role="group"
              aria-label="Preview framework"
            >
              {Object.keys(examples).map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={framework === name}
                  onClick={() => setFramework(name)}
                  className={`min-h-11 cursor-pointer rounded-lg border px-3.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137] ${framework === name ? "border-[#294137] bg-[#294137] text-white" : "border-[#CFDDD5] bg-[#f6f8f7] text-[#294137] hover:bg-[#e2ece6]"}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0 overflow-hidden rounded-xl border border-[#CFDDD5] bg-[#f6f8f7]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#CFDDD5] px-5 py-4 text-xs font-semibold text-[#526159]">
              <span>{framework} example</span>
              <span className="text-[#294137]">Checkout flow</span>
            </div>
            <pre
              tabIndex={0}
              aria-label={`${framework} example code`}
              className="overflow-x-auto p-5 text-xs leading-7 text-[#294137] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#294137]"
            >
              <code>{examples[framework]}</code>
            </pre>
          </div>
        </Motion.article>
      </div>
    </section>
  );
}

export default PrecisionQA;
