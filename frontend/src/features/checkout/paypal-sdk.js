let sdkPromise;
let sdkClientId;

export function loadPayPalSdk(clientId) {
  if (sdkPromise && sdkClientId === clientId) return sdkPromise;
  if (sdkPromise) return Promise.reject(new Error("PayPal configuration changed. Refresh checkout before continuing."));
  sdkClientId = clientId;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const url = new URL("https://www.paypal.com/sdk/js");
    url.search = new URLSearchParams({ "client-id": clientId, vault: "true", intent: "subscription", components: "buttons", currency: "USD" }).toString();
    script.src = url.href; script.async = true;
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.setAttribute("data-namespace", "casefyPayPal");
    script.onload = () => {
      if (window.casefyPayPal?.Buttons) resolve(window.casefyPayPal);
      else { sdkPromise = null; script.remove(); reject(new Error("PayPal could not load. Please retry.")); }
    };
    script.onerror = () => { sdkPromise = null; script.remove(); reject(new Error("PayPal could not load. Check your connection or try Stripe.")); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}
