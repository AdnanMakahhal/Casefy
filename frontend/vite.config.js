import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // The services router owns /api in both `vercel dev` and deployment.
  // Override standalone-development .env URLs without exposing internal bindings.
  define: mode === "vercel" ? { "import.meta.env.VITE_API_URL": JSON.stringify("/api") } : {},
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
}));
