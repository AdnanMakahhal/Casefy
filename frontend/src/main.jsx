import "./styles/index.css";
import P from "./ui/P";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "react-error-boundary";
import AuthProvider from "./features/authentication/AuthProvider";
import ToastProvider from "./Context/ToastProvider";
import "./styles/fonts.js";
import SiteStartup from "./components/SiteStartup";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={<P variant="unstyled">Something went wrong. Please refresh the page.</P>}
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
