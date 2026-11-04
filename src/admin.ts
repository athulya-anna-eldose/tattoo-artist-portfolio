const API_ROOT = String(import.meta.env.VITE_API_URL ?? "").replace(
  /\/+$/,
  ""
);

// Clean up anything saved by the older version of this file
try {
  localStorage.removeItem("adminKey");
  localStorage.removeItem("adminVerified");
} catch {
  // ignore
}

// The key comes ONLY from the current URL (?admin=KEY).
// It is read once and kept in memory, never saved in the browser,
// so the plain link never gets admin buttons.
const KEY: string | null = new URLSearchParams(window.location.search).get(
  "admin"
);

// Remembers (for this tab only) that the backend accepted this key,
// so the page does not need to ask again after a reload.
const OK_FLAG = "adminOkFor";

export const isAdmin = (): boolean => {
  if (!KEY) return false;

  try {
    return sessionStorage.getItem(OK_FLAG) === KEY;
  } catch {
    return false;
  }
};

export function adminLogout() {
  try {
    sessionStorage.removeItem(OK_FLAG);
  } catch {
    // ignore
  }
  // Go to the plain link (no ?admin=...)
  window.location.href = window.location.pathname;
}

// Use for upload / reorder / delete / settings save
export function adminFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (KEY) headers.set("X-Admin-Key", KEY);
  return fetch(url, { ...options, headers });
}

// Ask the backend if the key in the URL is correct
async function verify() {
  if (!KEY) return;

  let alreadyOk = false;

  try {
    alreadyOk = sessionStorage.getItem(OK_FLAG) === KEY;
  } catch {
    // ignore
  }

  try {
    const res = await fetch(`${API_ROOT}/api/admin/check`, {
      method: "POST",
      headers: { "X-Admin-Key": KEY },
    });

    if (res.ok && !alreadyOk) {
      try {
        sessionStorage.setItem(OK_FLAG, KEY);
      } catch {
        // ignore
      }
      window.location.reload(); // reload once so the buttons appear
    } else if (!res.ok && res.status === 403 && alreadyOk) {
      try {
        sessionStorage.removeItem(OK_FLAG);
      } catch {
        // ignore
      }
      window.location.reload(); // key was changed: hide the buttons
    }
  } catch {
    // Server asleep or offline: keep the current state
  }
}

void verify();