import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// The access-token cookie only lives 15 minutes; the 7-day refresh-token
// cookie exists specifically so a session can keep going past that without
// forcing a re-login. Nothing was ever calling POST /auth/refresh though, so
// every user got silently logged out (401s) 15 minutes into any session —
// this interceptor is what actually uses the refresh token for its purpose.
const NO_REFRESH_RETRY_PATHS = ["/auth/login", "/auth/register", "/auth/google", "/auth/refresh"];

let refreshPromise = null;

function shouldAttemptRefresh(config) {
  if (!config || config._retriedAfterRefresh) return false;
  const url = config.url || "";
  return !NO_REFRESH_RETRY_PATHS.some((p) => url.includes(p));
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response || response.status !== 401 || !shouldAttemptRefresh(config)) {
      throw error;
    }
    // Several requests can all 401 at once right as the access token
    // expires — share one refresh call instead of firing one per request.
    if (!refreshPromise) {
      refreshPromise = api.post("/auth/refresh").finally(() => {
        refreshPromise = null;
      });
    }
    try {
      await refreshPromise;
    } catch {
      throw error; // refresh token is also gone/expired — surface the original 401
    }
    config._retriedAfterRefresh = true;
    return api(config);
  }
);

export function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default api;
