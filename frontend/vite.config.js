import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function getGitBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"],
    }).toString().trim();
  } catch {
    return "";
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  cacheDir: "../node_modules/.vite/frontend",
  define: {
    "import.meta.env.VITE_GIT_BRANCH": JSON.stringify(
      command === "serve" ? getGitBranch() : ""
    ),
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./app"),
      "@features": path.resolve(__dirname, "./features"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    cache: {
      dir: "../node_modules/.vitest/frontend",
    },
  },
  server: {
    host: true
  }
}));
