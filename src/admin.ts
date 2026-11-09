
const API_ROOT = String(import.meta.env.VITE_API_URL ?? "").replace(
  /\/+$/,
  ""
);

// Clean up anything saved by the older version of this file
try {
  localStorage.removeItem("adminKey");
  localStorage.removeItem("adminVerified");
} catch {
  // Ignore storage errors
}

// The key comes only from the current URL (?admin=KEY).
// It is read once and kept in memory, never saved in the browser.
const KEY: string | null = new URLSearchParams(
  window.location.search
).get("admin");

// Remembers (for this tab only) that the backend accepted this key
const OK_FLAG = "adminOkFor";

// Check whether the current tab has been verified
export const isAdmin = (): boolean => {
  if (!KEY) return false;

  try {
    return sessionStorage.getItem(OK_FLAG) === KEY;
  } catch {
    return false;
  }
};

// Log out and return to the normal website
export function adminLogout() {
  try {
    sessionStorage.removeItem(OK_FLAG);
  } catch {
    // Ignore storage errors
  }

  window.location.href = window.location.pathname;
}

// Use for upload / reorder / delete / settings save
export function adminFetch(
  url: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);

  if (KEY) {
    headers.set("X-Admin-Key", KEY);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Ask the backend whether the key in the URL is correct
async function verify() {
  if (!KEY) return;

  let alreadyOk = false;

  try {
    alreadyOk = sessionStorage.getItem(OK_FLAG) === KEY;
  } catch {
    // Ignore storage errors
  }

  try {
    const res = await fetch(`${API_ROOT}/api/admin/check`, {
      method: "POST",
      headers: {
        "X-Admin-Key": KEY,
      },
    });

    if (res.ok && !alreadyOk) {
      try {
        sessionStorage.setItem(OK_FLAG, KEY);
      } catch {
        // Ignore storage errors
      }

      window.location.reload();
    } else if (!res.ok && res.status === 403 && alreadyOk) {
      try {
        sessionStorage.removeItem(OK_FLAG);
      } catch {
        // Ignore storage errors
      }

      window.location.reload();
    }
  } catch {
    // Server may be asleep or offline
  }
}

void verify();
