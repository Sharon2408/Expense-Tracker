/**
 * Thin fetch wrapper shared by every *Api module. Components never call
 * fetch() or know about the backend's URL shape directly - they only ever
 * import from src/api/*, so swapping the backend (or moving to a different
 * stack entirely) means editing this layer, not the UI.
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let accessToken = null;
let onUnauthorized = null;
let refreshFn = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

/**
 * Registered by AuthContext. Must return a fresh access token (and call
 * setAccessToken itself) or throw. Kept as an injected function rather than
 * importing authApi here to avoid a circular import (authApi -> httpClient).
 */
export function setRefreshHandler(fn) {
  refreshFn = fn;
}

async function doFetch(path, method, finalHeaders, body, isForm) {
  return fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    credentials: 'include',
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false, raw = false, _retried = false } = {}) {
  const finalHeaders = { ...headers };
  if (!isForm) finalHeaders['Content-Type'] = 'application/json';
  if (accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;

  let res = await doFetch(path, method, finalHeaders, body, isForm);

  // A 401 on a data route (not the auth endpoints themselves) usually just
  // means the short-lived access token expired mid-session. Try one silent
  // refresh-and-retry before giving up, so an open tab does not get logged
  // out every 15 minutes while the 30-day refresh cookie is still valid.
  if (res.status === 401 && !_retried && !path.startsWith('/auth/') && refreshFn) {
    try {
      await refreshFn();
      return request(path, { method, body, headers, isForm, raw, _retried: true });
    } catch {
      // Refresh itself failed (cookie expired/revoked) - fall through to the
      // normal 401 handling below, which logs the user out.
    }
  }

  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  if (raw) return res;

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const error = new Error((data && data.error) || 'Request failed');
    error.status = res.status;
    error.details = data && data.details;
    throw error;
  }
  return data;
}

export const http = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  raw: (path, opts) => request(path, { ...opts, raw: true }),
};
