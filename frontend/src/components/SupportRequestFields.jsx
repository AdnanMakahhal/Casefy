const inputClass = "mt-2 min-h-11 w-full rounded-md border border-[#CFDDD5] bg-white px-3 py-2 text-sm text-[#102019] focus:outline-2 focus:outline-offset-2 focus:outline-[#294137]";
export default function SupportRequestFields({ category, value, onChange }) {
  const fields = category === "refund" ? [
    ["paymentReference", "Payment reference", "text", true],
    ["reason", "Reason for refund", "text", true],
    ["refundAmount", "Amount requested (USD, optional)", "number", false],
  ] : category === "payment" ? [
    ["paymentReference", "Payment reference (optional)", "text", false],
  ] : category === "contact" ? [
    ["company", "Company (optional)", "text", false],
    ["phone", "Phone (optional)", "tel", false],
  ] : [];
  if (!fields.length) return null;
  return <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label, type, required]) => <label key={key} className="block text-sm font-medium">{label}<input name={key} type={type} required={required} min={type === "number" ? 1 : undefined} max={type === "number" ? 100000000 : undefined} step={type === "number" ? (["budget", "refundAmount"].includes(key) ? 0.01 : 1) : undefined} maxLength={key === "reason" ? 500 : 160} value={value[key] || ""} onChange={(event) => onChange({ ...value, [key]: event.target.value })} className={inputClass} /></label>)}</div>;
}
