import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: "../node_modules/.vite/frontend",
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
});
