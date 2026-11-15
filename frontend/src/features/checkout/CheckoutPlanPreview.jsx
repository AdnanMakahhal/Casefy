import { useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowLeft, Check, House } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ReceiptPrinterHeader,
  ReceiptPrinterMachine,
  ReceiptPrinterOutput,
  ReceiptPrinterPaper,
  ReceiptPrinterRoot,
  ReceiptPrinterScreen,
  ReceiptPrinterStatus,
} from "./ReceiptPrinter";

export default function CheckoutPlanPreview({
  planName,
  priceLabel,
  period,
  hasPrice,
  loading,
  error,
  user,
  features,
  annualSavings,
  annualDiscount,
  annualBase,
  money,
  isFree,
  isEnterprise,
  busy,
}) {
  const [printed, setPrinted] = useState(false);
  const reducedMotion = useReducedMotion();
  const stage =
    loading || busy
      ? "processing"
      : error || printed || reducedMotion
        ? "complete"
        : "printing";
  const interval = isFree
    ? "No payment required"
    : isEnterprise
      ? "Custom quote"
      : period === "year"
        ? "Annual subscription"
        : "Monthly subscription";
  const totalLabel = isEnterprise
    ? "CUSTOM PRICE"
    : isFree
      ? "PLAN PRICE"
      : period === "year"
        ? "ANNUAL TOTAL"
        : "MONTHLY TOTAL";

  return (
    <aside
      aria-label="Selected plan summary"
      className="flex min-w-0 flex-col items-center rounded-3xl border border-[#dce6df] bg-[#edf3ef] px-3 pt-6 pb-4 sm:px-5 sm:pt-7"
    >
      <ReceiptPrinterRoot stage={stage} animate={!error}>
        <ReceiptPrinterMachine>
          <ReceiptPrinterHeader>
            <img
              src="/Logo/Logo_Casefy_Light.svg"
              alt="Casefy logo"
              width="150"
              height="50"
              className="block h-[50px] w-[150px] shrink-0 self-center object-contain"
            />
            <Link
              to="/"
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-[#edf3ef] shadow-[0_3px_0_#10201966,inset_0_1px_0_#ffffff12] transition-[background-color,transform] hover:bg-white/20 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
            >
              <House size={13} aria-hidden="true" />
              Home
            </Link>
          </ReceiptPrinterHeader>
          <ReceiptPrinterScreen>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                <p className="break-words text-base font-semibold leading-6 text-white">
                  {planName}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#a9c0b1]">
                  {interval}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <p className="text-[10px] tracking-wider text-[#a9c0b1]">
                  {isEnterprise ? "PRICE" : "TOTAL"}
                </p>
                <p className="mt-1 break-words text-xl font-bold tracking-tight text-white tabular-nums">
                  {priceLabel}
                </p>
              </div>
            </div>
            <ReceiptPrinterStatus error={Boolean(error)}>
              {error
                ? "Price unavailable. Please try loading again."
                : busy
                  ? "Opening secure Stripe Checkout..."
                  : loading
                    ? "Preparing your plan summary"
                    : stage === "printing"
                      ? "Printing your plan summary"
                      : "Plan ready to review"}
            </ReceiptPrinterStatus>
          </ReceiptPrinterScreen>
        </ReceiptPrinterMachine>
        <ReceiptPrinterOutput onFeedComplete={() => setPrinted(true)}>
          <ReceiptPrinterPaper aria-label="Selected plan summary, not a payment receipt">
            <div className="border-b border-dashed border-[#bfcfc3] pb-6 text-center">
              <img
                src="/Logo/Logo_Casefy.svg"
                alt="Casefy logo"
                width="150"
                height="50"
                className="mx-auto block h-[50px] w-[150px] bg-white object-contain"
              />
              <p className="mt-4 text-[10px] tracking-[0.18em] text-[#7a8d7f]">
                CASEFY / PLAN SUMMARY
              </p>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-[#bfcfc3] py-5">
              <div>
                <h2 className="text-xs font-bold tracking-wide uppercase">
                  {planName}
                </h2>
                <p className="mt-1.5 text-[11px] leading-5 text-[#7a8d7f]">
                  {interval}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{priceLabel}</p>
            </div>
            {annualSavings > 0 && (
              <dl className="space-y-2.5 pt-5 text-[11px] leading-5">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7a8d7f]">Monthly rate x 12</dt>
                  <dd className="shrink-0 tabular-nums">{money(annualBase)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#7a8d7f]">
                    Annual savings ({annualDiscount}%)
                  </dt>
                  <dd className="shrink-0 tabular-nums">
                    -{money(annualSavings)}
                  </dd>
                </div>
              </dl>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-[#bfcfc3] py-5">
              <span className="text-[11px] font-bold tracking-wider">
                {totalLabel}
              </span>
              <span className="text-right text-2xl font-bold tracking-tight tabular-nums">
                {priceLabel}
                {hasPrice && (
                  <span className="ml-1 text-[10px] font-normal tracking-normal">
                    / {period}
                  </span>
                )}
              </span>
            </div>
            <dl className="mt-5 space-y-3 text-[11px] leading-5">
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-[#7a8d7f]">Account</dt>
                <dd className="min-w-0 break-words text-right">{user.name}</dd>
              </div>
              {user.workspaceName && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[#7a8d7f]">Workspace</dt>
                  <dd className="min-w-0 break-words text-right">
                    {user.workspaceName}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-6 text-[10px] tracking-widest text-[#7a8d7f]">
              INCLUDED WITH YOUR PLAN
            </p>
            <ul className="mt-3 space-y-2.5">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-[11px] leading-5"
                >
                  <Check
                    size={12}
                    aria-hidden="true"
                    className="mt-1 shrink-0"
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-dashed border-[#bfcfc3] pt-5 text-center">
              <p className="text-[10px] leading-5 text-[#7a8d7f]">
                {isFree
                  ? "Your Free plan needs no payment."
                  : isEnterprise
                    ? "Contact support for your custom quote."
                    : "Payment is completed securely with Stripe."}
              </p>
              <p className="mt-2 text-[9px] tracking-wider text-[#7a8d7f]">
                PLAN PREVIEW / NOT A PAYMENT RECEIPT
              </p>
            </div>
          </ReceiptPrinterPaper>
        </ReceiptPrinterOutput>
      </ReceiptPrinterRoot>
      <Link
        to="/pricing"
        className="mt-1 inline-flex min-h-10 items-center gap-2 rounded text-sm font-semibold text-[#294137] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#294137]"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Change plan
      </Link>
    </aside>
  );
}
