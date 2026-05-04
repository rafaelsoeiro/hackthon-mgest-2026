import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  throw new Error(`Invalid boolean env value "${value}". Use true/false.`);
}

function validateFrontendEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), "");
  if (!env.VITE_API_URL || env.VITE_API_URL.trim() === "") {
    throw new Error("VITE_API_URL is required.");
  }

  parseBoolean(env.VITE_FEATURE_JIRA_ENABLED, true);
  parseBoolean(env.VITE_FEATURE_AI_ENABLED, false);
  parseBoolean(env.VITE_FEATURE_EVOLUTION_ENABLED, false);
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  validateFrontendEnv(mode);

  return ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  });
});
