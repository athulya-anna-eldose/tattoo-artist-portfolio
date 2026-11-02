// If the URL has ?admin=KEY, save the key in this browser and clean the URL
const params = new URLSearchParams(window.location.search);
const keyFromUrl = params.get("admin");
if (keyFromUrl) {
  localStorage.setItem("adminKey", keyFromUrl);
  window.history.replaceState({}, "", window.location.pathname);
}

export const isAdmin = () => !!localStorage.getItem("adminKey");

export function adminLogout() {
  localStorage.removeItem("adminKey");
  window.location.reload();
}

// use this instead of fetch() for upload / reorder / delete / settings save
export function adminFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const key = localStorage.getItem("adminKey");
  if (key) headers.set("X-Admin-Key", key);
  return fetch(url, { ...options, headers });
}