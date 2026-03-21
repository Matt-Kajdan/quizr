const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const NORMALIZED_BASE = RAW_BACKEND_URL.replace(/\/$/, "");

export const BACKEND_URL = NORMALIZED_BASE
  ? (NORMALIZED_BASE.endsWith("/api") ? NORMALIZED_BASE : `${NORMALIZED_BASE}/api`)
  : "/api";
