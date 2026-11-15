import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/authentication/authContext";
import { sessionRequest } from "../features/admin/api";
import { loadPayPalSdk } from "../features/checkout/paypal-sdk";

export default function PayPalSubscribeButton({ plan, billing, disabled, onBusyChange }) {
  const container = useRef(null), actions = useRef(null), unavailable = useRef(true), blocked = useRef(disabled);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    blocked.current = disabled;
    if (actions.current) {
      if (disabled || unavailable.current) actions.current.disable();
      else actions.current.enable();
    }
  }, [disabled]);
  useEffect(() => {
    let active = true, buttons;
    const target = container.current;
    async function render() {
      setLoading(true); setError(""); setNotice("");
      try {
        const config = await sessionRequest(`/billing/paypal/config?${new URLSearchParams({ plan, billing })}`);
        const paypal = await loadPayPalSdk(config.clientId);
        if (!active) return;
        unavailable.current = !config.available;
        buttons = paypal.Buttons({
          fundingSource: paypal.FUNDING.PAYPAL,
          style: { shape: "rect", color: "gold", layout: "horizontal", label: "subscribe", height: 48, tagline: false },
          onInit: (_data, controls) => { actions.current = controls; if (!config.available || blocked.current) controls.disable(); },
          onClick: (_data, controls) => {
            if (!config.available || blocked.current) { setNotice("PayPal is not available for this plan yet. You can continue with Stripe."); return controls.reject(); }
            setError(""); setNotice(""); return controls.resolve();
          },
          createSubscription: async () => {
            onBusyChange(true);
            try { return (await sessionRequest("/billing/paypal/subscriptions", { method: "POST", body: JSON.stringify({ plan, billing }) })).subscriptionId; }
            catch (err) { if (active) setError(err.message); onBusyChange(false); throw err; }
          },
          onApprove: async (data) => {
            try {
              const result = await sessionRequest("/billing/paypal/verify", { method: "POST", body: JSON.stringify({ subscriptionId: data.subscriptionID }) });
              await refreshUser();
              if (result.verified) navigate("/profile?paypal=approved");
              else if (active) setNotice(result.message);
            } catch (err) { if (active) setError(err.message); }
            finally { onBusyChange(false); }
          },
          onCancel: async () => {
            onBusyChange(false);
            if (active) setNotice("PayPal approval was not completed. Resume or cancel the pending PayPal subscription from your profile before choosing another payment method.");
            await refreshUser().catch(() => {});
          },
          onError: () => { if (active) setError("PayPal could not complete checkout. Please retry or contact support."); onBusyChange(false); },
        });
        await buttons.render(target);
        if (active) {
          setLoading(false);
          if (!config.available) setNotice("PayPal is not available for this plan yet. You can continue with Stripe.");
        }
      } catch (err) { if (active) { setError(err.message); setLoading(false); } }
    }
    render();
    return () => {
      active = false; actions.current = null;
      if (buttons) { try { Promise.resolve(buttons.close()).catch(() => {}); } catch { /* Already closed by PayPal. */ } }
    };
  }, [plan, billing, attempt, onBusyChange, refreshUser, navigate]);

  return <section aria-label="PayPal subscription payment" className="mt-5">
    <div className="mb-4 flex items-center gap-3 text-[11px] text-[#718578]"><span className="h-px flex-1 bg-[#e5ece7]" />or subscribe with PayPal<span className="h-px flex-1 bg-[#e5ece7]" /></div>
    {loading && <div role="status" className="mb-3 h-12 animate-pulse rounded bg-[#fff0bc] motion-reduce:animate-none"><span className="sr-only">Loading PayPal...</span></div>}
    <div ref={container} className="relative z-0 min-h-12" />
    {notice && <p role="status" className="mt-3 text-center text-xs leading-5 text-[#526159]">{notice}</p>}
    {error && <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"><p>{error}</p><button type="button" disabled={disabled} onClick={() => setAttempt((value) => value + 1)} className="mt-2 font-semibold underline disabled:opacity-50">Try PayPal again</button></div>}
  </section>;
}
