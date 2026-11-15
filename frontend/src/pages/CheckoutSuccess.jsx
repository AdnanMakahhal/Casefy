import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { homeForRole, useAuth } from "../features/authentication/authContext";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user, getCheckoutStatus } = useAuth();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    let timer;
    let polls = 0;
    async function check() {
      try {
        const status = await getCheckoutStatus(sessionId);
        if (!active) return;
        setResult(status);
        setError("");
        if (status.status === "complete" && status.user?.plan === "free" && ++polls < 5) timer = setTimeout(check, 2000);
      } catch (error) { if (active) setError(error.message); }
    }
    check();
    return () => { active = false; clearTimeout(timer); };
  }, [getCheckoutStatus, sessionId, attempt]);

  const confirmed = result?.status === "complete" && ["plus", "pro", "enterprise"].includes(result.user?.plan);
  return <section className="mx-auto max-w-xl px-6 py-16">
    <div className="rounded-xl border border-[#CFDDD5] bg-white p-8">
      <h1 className="text-3xl font-bold tracking-tight">{confirmed ? "Thanks for your subscription!" : "Checking your subscription"}</h1>
      <p role={error || !sessionId ? "alert" : "status"} className="mt-4 text-sm leading-6 text-[#526159]">{!sessionId ? "No Checkout session was provided." : error || (confirmed ? "We appreciate your business! Stripe has confirmed your payment and your Casefy plan is updated." : result?.status === "complete" ? "Stripe is still confirming your payment. Your plan will update once payment is confirmed." : result ? "Checkout has not been completed. No paid access has been granted." : "Confirming your payment with Stripe...")}</p>
      {sessionId && !confirmed && <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className="mt-6 min-h-11 cursor-pointer rounded-lg border border-[#CFDDD5] px-4 text-sm font-semibold text-[#294137]">Check again</button>}
      <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-[#294137]"><Link to="/profile" className="rounded hover:underline focus-visible:outline-2">View profile</Link><Link to={homeForRole(user.role)} className="rounded hover:underline focus-visible:outline-2">Go to workspace</Link></div>
    </div>
  </section>;
}
