import { useEffect, useState } from "react";
import { apiRequest, tokenKey } from "../authentication/api";

export const adminRequest = (path, options) => apiRequest(`/admin${path}`, { token: sessionStorage.getItem(tokenKey), ...options });
export const sessionRequest = (path, options) => apiRequest(path, { token: sessionStorage.getItem(tokenKey), ...options });
export const titleCase = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
export const displayDate = (value) => value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not set";
export const currencyDigits = (currency) => new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
export const formatMoney = (amount, currency = "usd") => new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(amount / 10 ** currencyDigits(currency));

export function useStaffData(path, revision = 0, session = false, keepPreviousData = false) {
  const [state, setState] = useState({ path: null, revision: -1, data: null, error: "" });
  useEffect(() => {
    let active = true;
    (session ? sessionRequest(path) : adminRequest(path)).then((data) => {
      if (active) setState({ path, revision, data, error: "" });
    }).catch((error) => { if (active) setState({ path, revision, data: null, error: error.message }); });
    return () => { active = false; };
  }, [path, revision, session]);
  const refreshing = state.path !== path || state.revision !== revision;
  const loading = refreshing && (!keepPreviousData || state.path !== path || !state.data);
  return { loading, refreshing, data: loading ? null : state.data, error: loading ? "" : state.error };
}
