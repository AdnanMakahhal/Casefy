import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/GlobalStyles.css";
import { ErrorBoundary } from "react-error-boundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={<p>Something went wrong. Please refresh the page.</p>}
      onReset={() => window.location.replace("/")}
    >
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
