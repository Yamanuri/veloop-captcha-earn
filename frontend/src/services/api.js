const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'veloop_token'; // auth token only. NEVER wallet / rewards / answers.

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(method, path, body) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server. Check your connection and try again.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    if (res.status === 401 && path !== '/api/auth/login') onUnauthorized();
    throw new ApiError(res.status, json.code || 'ERROR', json.message || 'Something went wrong.');
  }
  return json;
}

export const api = {
  register: (name, email, password) => request('POST', '/api/auth/register', { name, email, password }),
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  getCurrent: () => request('GET', '/api/captcha/current'),
  newChallenge: () => request('POST', '/api/captcha/new'),
  // Only the challenge id and the chosen option are ever sent. The server decides everything else.
  verify: (challengeId, selectedOption) => request('POST', '/api/captcha/verify', { challengeId, selectedOption }),
  claim: (challengeId) => request('POST', '/api/captcha/claim', { challengeId }),
  history: (page = 1, limit = 10) => request('GET', `/api/captcha/history?page=${page}&limit=${limit}`),
  getConfig: () => request('GET', '/api/captcha/config'),
  getGems: () => request('GET', '/api/wallet/gems'),
};
