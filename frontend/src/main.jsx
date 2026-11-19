import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ErrorBoundary } from "react-error-boundary";
import AuthProvider from "./features/authentication/AuthProvider";
import ToastProvider from "./Context/ToastProvider";
import { applyFontVariables } from "./styles/fonts";
import SiteStartup from "./components/SiteStartup";

applyFontVariables();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={<p>Something went wrong. Please refresh the page.</p>}
      onReset={() => window.location.replace("/")}
    >
      <ToastProvider>
        <AuthProvider>
          <SiteStartup>
            <App />
          </SiteStartup>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
