import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, CSSProperties, PointerEvent } from "react";
import "./piercing.css";

import deleteIcon from "../../assets/images.png";
import { adminFetch, isAdmin } from "../../admin";

import tattoo1 from "../../assets/1d (11).jpg";
import tattoo2 from "../../assets/1d (3).jpg";
import tattoo3 from "../../assets/1d (4).jpg";
import tattoo4 from "../../assets/1d (5).jpg";
import tattoo5 from "../../assets/1d (6).jpg";
import tattoo6 from "../../assets/1d (7).jpg";
import tattoo7 from "../../assets/1d (8).jpg";
import tattoo8 from "../../assets/1d (12).jpg";
import tattoo9 from "../../assets/1d (13).jpg";
import tattoo10 from "../../assets/1d (14).jpg";
import tattoo11 from "../../assets/1d (15).jpg";
import tattoo12 from "../../assets/1d (18).jpg";
import { useBackStack } from "../../useBackStack";

interface PiercingProps {
  onBackToHome: () => void;
}

interface Tattoo {
  id: string;
  image: string;
  category?: string;
  uploaded: boolean;
  backendId?: number;
  name?: string;
}

interface UploadedImage {
  id: string;
  src: string;
  backendId: number;
  name?: string;
}

/* ---------------------------------------------------------
   API configuration
   --------------------------------------------------------- */

// Base URL of the backend (set VITE_API_URL in Vercel).
// Trailing slashes are removed so we never build "//api/..." URLs.
const API_ROOT = String(import.meta.env.VITE_API_URL ?? "").replace(
  /\/+$/,
  ""
);

const API_URL = `${API_ROOT}/api/piercings`;

/* ---------------------------------------------------------
   Resilient fetch
   Free hosting (Render, Railway, ...) puts the server to sleep and
   takes 10-60 s to wake up. While it wakes, requests are slow or
   answered with 502/503/504 (which also lack CORS headers, so the
   browser reports them as "Failed to fetch"). We wait longer and
   retry instead of showing an error straight away.
   --------------------------------------------------------- */

const REQUEST_TIMEOUT_MS = 45000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;
// While the error banner is visible, silently retry this often.
const ERROR_RETRY_INTERVAL_MS = 10000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const fetchWithRetry = async (
  url: string,
  init: RequestInit = {},
  attempts: number = MAX_ATTEMPTS,
  // Pass true for requests that change data (PUT/POST/DELETE) so the
  // admin key header is added.
  admin: boolean = false
): Promise<Response> => {
  let lastError: unknown = new Error("Request failed");

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      const send = admin ? adminFetch : fetch;

      const response = await send(url, {
        ...init,
        signal: controller.signal,
      });

      // Gateway errors mean the host is still waking up: try again.
      if (
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504
      ) {
        throw new Error(`Server not ready (${response.status})`);
      }

      return response;
    } catch (error) {
      lastError = error;
    } finally {
      window.clearTimeout(timer);
    }

    if (attempt < attempts - 1) {
      // 2 s, 4 s, 8 s ...
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError;
};

/**
 * Turns whatever the backend returns for one piercing into a full image URL.
 * Your backend returns `imageUrl` like "/uploads/piercings/abc.jpg".
 */
const IMAGE_FIELDS = [
  "imageUrl",
  "imagePath",
  "image",
  "url",
  "filePath",
  "fileUrl",
  "fileName",
  "filename",
  "path",
  "src",
] as const;

const resolveImageSrc = (item: unknown): string | null => {
  if (!item || typeof item !== "object") return null;

  const record = item as Record<string, unknown>;

  for (const field of IMAGE_FIELDS) {
    const value = record[field];

    if (typeof value !== "string" || value.trim() === "") continue;

    const raw = value.trim();

    // Already a full URL (Cloudinary, S3, absolute backend URL...).
    if (/^https?:\/\//i.test(raw)) return raw;

    if (raw.startsWith("data:")) return raw;

    const cleaned = raw.replace(/\\/g, "/").replace(/^\/+/, "");

    if (cleaned.startsWith("uploads/")) {
      return `${API_ROOT}/${cleaned}`;
    }

    return `${API_ROOT}/uploads/${cleaned}`;
  }

  return null;
};

const getBackendId = (item: unknown): number | null => {
  if (!item || typeof item !== "object") return null;

  const id = Number((item as Record<string, unknown>).id);

  return Number.isInteger(id) && id > 0 ? id : null;
};

/** The piercing name saved by the backend (the "name" field). */
const getName = (item: unknown): string | undefined => {
  if (!item || typeof item !== "object") return undefined;

  const value = (item as Record<string, unknown>).name;

  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
};

/** Default piercing name = file name without the extension. */
const nameFromFile = (file: File) => file.name.replace(/\.[^/.]+$/, "");

/* ---------------------------------------------------------
   Shared settings stored on the BACKEND
   (order of all images + which built-in images are deleted),
   so a change made on one device shows on every device.
   --------------------------------------------------------- */

const SETTINGS_BASE = `${API_ROOT}/api/settings`;
const ORDER_KEY = "piercings-order";
const HIDDEN_KEY = "piercings-hidden";

// How often an open page checks the server for changes made elsewhere.
const SYNC_INTERVAL_MS = 30000;

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

const readSetting = async (key: string): Promise<string[] | null> => {
  const response = await fetchWithRetry(`${SETTINGS_BASE}/${key}`);

  if (!response.ok) {
    throw new Error(`Could not read setting: ${response.status}`);
  }

  const data = (await response.json()) as { value?: unknown };

  if (typeof data?.value !== "string") return null;

  const parsed: unknown = JSON.parse(data.value);

  return Array.isArray(parsed) &&
    parsed.every((item) => typeof item === "string")
    ? parsed
    : null;
};

const writeSetting = async (key: string, ids: string[]): Promise<void> => {
  const response = await fetchWithRetry(
    `${SETTINGS_BASE}/${key}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: JSON.stringify(ids) }),
    },
    MAX_ATTEMPTS,
    true
  );

  if (!response.ok) {
    throw new Error(`Could not save setting: ${response.status}`);
  }
};

/* ---------------------------------------------------------
   Built-in images
   --------------------------------------------------------- */

const baseTattoos: Tattoo[] = [
  tattoo1,
  tattoo2,
  tattoo3,
  tattoo4,
  tattoo5,
  tattoo6,
  tattoo7,
  tattoo8,
  tattoo9,
  tattoo10,
  tattoo11,
  tattoo12,
].map((image, index) => ({
  id: `base-${index}`,
  image,
  category: "Minimal Line Works",
  uploaded: false,
}));

const ORDER_STORAGE_KEY = "wg-piercing-order-v2";
const OLD_ORDER_STORAGE_KEY = "wg-piercing-order-v1";
const HIDDEN_STORAGE_KEY = "wg-piercing-hidden-v1";

const defaultOrder = baseTattoos.map((item) => item.id);

/* Local copies are only a fast first paint; the server is the truth. */

const loadOrder = (): string[] => {
  try {
    const raw = localStorage.getItem(ORDER_STORAGE_KEY);

    if (raw) {
      const saved: unknown = JSON.parse(raw);

      if (
        Array.isArray(saved) &&
        saved.every((id) => typeof id === "string")
      ) {
        return saved;
      }
    }

    const oldRaw = localStorage.getItem(OLD_ORDER_STORAGE_KEY);

    if (oldRaw) {
      const old: unknown = JSON.parse(oldRaw);

      if (
        Array.isArray(old) &&
        old.length === baseTattoos.length &&
        new Set(old).size === baseTattoos.length &&
        old.every(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < baseTattoos.length
        )
      ) {
        return (old as number[]).map((index) => `base-${index}`);
      }
    }
  } catch {
    // Use the default order when stored data is invalid.
  }

  return defaultOrder;
};

const loadHidden = (): string[] => {
  try {
    const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);

    if (!raw) return [];

    const saved: unknown = JSON.parse(raw);

    if (
      Array.isArray(saved) &&
      saved.every((id) => typeof id === "string")
    ) {
      return saved;
    }
  } catch {
    // Ignore invalid saved data.
  }

  return [];
};

/* ---------------- Back button ---------------- */

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

function BackButton({
  onClick,
  className = "wg-back",
  label = "Go back",
}: BackButtonProps) {
  const isRight = className.includes("wg-arrow-right");

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isRight ? (
          <path d="M9 5l7 7-7 7" />
        ) : (
          <path d="M15 5l-7 7 7 7" />
        )}
      </svg>
    </button>
  );
}

/* Styles for the "piercing name" inputs in the upload popup. */

const nameListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  maxHeight: "40vh",
  overflowY: "auto",
  margin: "14px 0 18px",
  textAlign: "left",
};

const nameLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "5px",
  fontSize: "11px",
  letterSpacing: "1px",
  opacity: 0.65,
  wordBreak: "break-all",
};

const nameInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid rgba(215, 173, 105, 0.4)",
  borderRadius: "10px",
  background: "rgba(255, 255, 255, 0.06)",
  color: "inherit",
  font: "inherit",
  fontSize: "14px",
  outline: "none",
};

/* Name shown INSIDE A BOX on the carousel cards and the "View all" tiles. */

const cardNameStyle = (edge: "top" | "bottom"): CSSProperties => ({
  position: "absolute",
  left: 0,
  right: 0,
  [edge]: 0,
  zIndex: 4,
  boxSizing: "border-box",
  display: "block",
  // small bottom padding = text sits right at the bottom edge
  padding: edge === "bottom" ? "56px 20px 18px" : "18px 20px 56px",
  background:
    edge === "bottom"
      ? "linear-gradient(to top, rgba(8, 7, 5, 0.88) 0%, rgba(8, 7, 5, 0.55) 45%, rgba(8, 7, 5, 0) 100%)"
      : "linear-gradient(to bottom, rgba(8, 7, 5, 0.88) 0%, rgba(8, 7, 5, 0.55) 45%, rgba(8, 7, 5, 0) 100%)",
  border: "none",
  borderRadius: 0,

  color: "#fff",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "clamp(15px, 1.1vw + 8px, 20px)", // slightly larger
  fontWeight: 400,
  letterSpacing: "0.3px",
  textTransform: "none",

  textAlign: "left",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  pointerEvents: "none",
  textShadow: "0 1px 4px rgba(0, 0, 0, 0.8)",
});

/* Name box under the full-screen image. */

const lightboxNameStyle: CSSProperties = {
  display: "inline-block",
  maxWidth: "90vw",
  boxSizing: "border-box",
  padding: "9px 22px",
  background: "rgba(12, 11, 9, 0.82)",
  border: "1px solid rgba(215, 173, 105, 0.55)",
  borderRadius: "12px",
  color: "#f4ead9",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "2px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

/* ---------------- Gallery component ---------------- */

function Piercing({ onBackToHome }: PiercingProps) {
  // true only in the browser that has the admin key (your client)
  const admin = isAdmin();

  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [showAll, setShowAll] = useState(false);
  const [order, setOrder] = useState<string[]>(loadOrder);
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [hidden, setHidden] = useState<string[]>(loadHidden);
  const [restoring, setRestoring] = useState(false);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [uploadsReady, setUploadsReady] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // One name per selected file (same order as pendingFiles).
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showReorderConfirm, setShowReorderConfirm] = useState(false);
  const [savingReorder, setSavingReorder] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef<UploadedImage[]>([]);
  const selectedImageRef = useRef<Tattoo | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const dragStartX = useRef(0);
  const dragDistance = useRef(0);
  const draggedRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);

  // Used to stop overlapping background syncs.
  const syncingRef = useRef(false);
  const syncIdRef = useRef(0);

  uploadsRef.current = uploads;

  // Only used as a fallback if the server does not return an image URL.
  const createObjectUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  const releaseObjectUrl = useCallback((url: string) => {
    if (objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  /* -------------------------------------------------------
     Sync with the BACKEND (shared by every device).
     Loads uploaded piercings, the saved order and deleted items,
     on page load, when you return to the tab, and every 30 s.
     ------------------------------------------------------- */

  const busyRef = useRef(false);

  busyRef.current =
    isReordering ||
    uploading ||
    deleting ||
    savingReorder ||
    showUploadConfirm ||
    showReorderConfirm ||
    pendingDeleteId !== null;

  const syncFromServer = useCallback(async (silent: boolean) => {
    // A background refresh never starts while another sync is still running
    // (a slow server can take minutes to answer). This prevents requests
    // piling up and old answers overwriting newer ones.
    if (silent && syncingRef.current) return;

    const syncId = ++syncIdRef.current;
    syncingRef.current = true;

    if (!silent) setLoadError(false);

    try {
      const [response, serverOrder, serverHidden] = await Promise.all([
        fetchWithRetry(API_URL),
        readSetting(ORDER_KEY).catch(() => null),
        readSetting(HIDDEN_KEY).catch(() => null),
      ]);

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The piercings API did not return a list.");
      }

      // A newer sync has started: ignore this older answer.
      if (syncId !== syncIdRef.current) return;

      // Do not change the screen while the user is in the middle of
      // reordering, uploading or deleting.
      if (silent && busyRef.current) return;

      // The server answered properly: hide the error banner.
      setLoadError(false);

      const loaded: UploadedImage[] = [];

      data.forEach((entry) => {
        const backendId = getBackendId(entry);
        const src = resolveImageSrc(entry);

        if (backendId === null || !src) return;

        loaded.push({
          id: `up-${backendId}`,
          src,
          backendId,
          name: getName(entry),
        });
      });

      setUploads((previous) =>
        sameJson(previous, loaded) ? previous : loaded
      );

      setOrder((previous) => {
        // The saved server order wins. If none exists yet, keep this
        // device's order for built-in images and add the uploads after it.
        const next =
          serverOrder ?? [
            ...previous.filter((id) => !id.startsWith("up-")),
            ...loaded.map((item) => item.id),
          ];

        return sameJson(previous, next) ? previous : next;
      });

      if (serverHidden) {
        setHidden((previous) =>
          sameJson(previous, serverHidden) ? previous : serverHidden
        );
      }
    } catch (error) {
      console.error("Could not sync piercings with the backend:", error);

      if (syncId === syncIdRef.current) {
        setLoadError(true);
      }
    } finally {
      if (syncId === syncIdRef.current) {
        syncingRef.current = false;
      }

      setUploadsReady(true);
    }
  }, []);

  // First load (and "Try again").
  useEffect(() => {
    void syncFromServer(false);
  }, [syncFromServer, reloadKey]);

  // Show a friendly "waking up" note only if the first load is slow.
  useEffect(() => {
    if (uploadsReady) {
      setSlowLoad(false);
      return;
    }

    const timer = window.setTimeout(() => setSlowLoad(true), 3000);

    return () => window.clearTimeout(timer);
  }, [uploadsReady]);

  // While the error banner is showing, keep retrying quietly so it
  // disappears by itself as soon as the server is awake.
  useEffect(() => {
    if (!loadError) return;

    const interval = window.setInterval(() => {
      if (busyRef.current) return;

      void syncFromServer(true);
    }, ERROR_RETRY_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadError, syncFromServer]);

  // Pick up changes made on other devices.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      if (busyRef.current) return;

      void syncFromServer(true);
    };

    const interval = window.setInterval(refresh, SYNC_INTERVAL_MS);

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [syncFromServer]);

  /* Release fallback blob URLs and timers when the page unmounts. */

  useEffect(() => {
    const urls = objectUrlsRef.current;

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  /* Build the gallery item lookup. */

  const itemsById = useMemo(() => {
    const map = new Map<string, Tattoo>();

    baseTattoos.forEach((item) => {
      if (!hidden.includes(item.id)) {
        map.set(item.id, item);
      }
    });

    uploads.forEach((item) => {
      map.set(item.id, {
        id: item.id,
        image: item.src,
        category: "Minimal Line Works",
        uploaded: true,
        backendId: item.backendId,
        name: item.name,
      });
    });

    return map;
  }, [uploads, hidden]);

  const displayIds = useMemo(() => {
    const sourceOrder = isReordering ? draftOrder : order;
    const seen = new Set<string>();
    const result: string[] = [];

    sourceOrder.forEach((id) => {
      if (itemsById.has(id) && !seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    });

    itemsById.forEach((_, id) => {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    });

    return result;
  }, [order, draftOrder, isReordering, itemsById]);

  const filteredTattoos = useMemo(
    () => displayIds.map((id) => itemsById.get(id)!),
    [displayIds, itemsById]
  );

  const backgroundImage =
    selectedImage ??
    filteredTattoos[activeIndex] ??
    filteredTattoos[0];

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  /* Keep a local copy of the committed order (fast first paint). */

  useEffect(() => {
    if (!uploadsReady) return;

    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch {
      // Local storage may be unavailable.
    }
  }, [order, uploadsReady]);

  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hidden));
    } catch {
      // Local storage may be unavailable.
    }
  }, [hidden]);

  /* Clamp the current slide after a deletion. */

  useEffect(() => {
    if (filteredTattoos.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= filteredTattoos.length) {
      setActiveIndex(filteredTattoos.length - 1);
    }
  }, [filteredTattoos.length, activeIndex]);

  /* Preload only nearby carousel images to reduce lag. */

  useEffect(() => {
    if (filteredTattoos.length === 0) return;

    const indexes = [
      activeIndex,
      (activeIndex + 1) % filteredTattoos.length,
      (activeIndex - 1 + filteredTattoos.length) % filteredTattoos.length,
    ];

    const urls = new Set(
      indexes
        .map((index) => filteredTattoos[index]?.image)
        .filter((url): url is string => Boolean(url))
    );

    urls.forEach((url) => {
      const image = new Image();
      image.src = url;
    });
  }, [activeIndex, filteredTattoos]);

  /* Automatically rotate the carousel.
     It pauses while the user is dragging, viewing an image, browsing
     "View all", or has any pop-up open, so the background never changes
     behind a dialog. */

  useEffect(() => {
    if (
      isDragging ||
      selectedImage ||
      showAll ||
      isReordering ||
      uploading ||
      showUploadConfirm ||
      showReorderConfirm ||
      pendingDeleteId !== null ||
      filteredTattoos.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filteredTattoos.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [
    isDragging,
    selectedImage,
    showAll,
    isReordering,
    uploading,
    showUploadConfirm,
    showReorderConfirm,
    pendingDeleteId,
    filteredTattoos.length,
  ]);

  /* Safety net: if a finger / mouse is released outside the carousel
     (or the browser cancels the gesture), always end the drag so the
     auto-rotation can never stay frozen. */

  useEffect(() => {
    if (!isDragging) return;

    const stopDragging = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [isDragging]);

  /* Lightbox helpers. */

  const openLightbox = useCallback((tattoo: Tattoo) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    selectedImageRef.current = tattoo;
    setIsClosing(false);
    setSelectedImage(tattoo);
  }, []);

  const closeLightbox = useCallback(() => {
    if (!selectedImageRef.current) return;

    setIsClosing(true);

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      selectedImageRef.current = null;
      setSelectedImage(null);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 280);
  }, []);

  const changeSelectedImage = useCallback(
    (direction: number) => {
      const current = selectedImageRef.current;

      if (!current || filteredTattoos.length === 0) return;

      const index = filteredTattoos.findIndex(
        (tattoo) => tattoo.id === current.id
      );

      if (index < 0) return;

      const nextIndex =
        (index + direction + filteredTattoos.length) %
        filteredTattoos.length;

      const nextImage = filteredTattoos[nextIndex];

      if (!nextImage) return;

      selectedImageRef.current = nextImage;
      setSelectedImage(nextImage);
      setActiveIndex(nextIndex);
    },
    [filteredTattoos]
  );

  useEffect(() => {
    if (
      !selectedImage &&
      !pendingDeleteId &&
      !showUploadConfirm &&
      !showReorderConfirm
    ) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (showUploadConfirm && !uploading) {
        setShowUploadConfirm(false);
        setPendingFiles([]);
        setPendingNames([]);
      } else if (showReorderConfirm && !savingReorder) {
        setShowReorderConfirm(false);
      } else if (pendingDeleteId && !deleting) {
        setPendingDeleteId(null);
      } else if (selectedImage) {
        closeLightbox();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedImage,
    pendingDeleteId,
    showUploadConfirm,
    showReorderConfirm,
    uploading,
    savingReorder,
    deleting,
    closeLightbox,
  ]);

  useEffect(() => {
    if (!selectedImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      // Do not change the image while typing in a text box.
      const target = event.target as HTMLElement | null;

      if (target && target.tagName === "INPUT") return;

      if (event.key === "ArrowLeft") {
        changeSelectedImage(-1);
      } else if (event.key === "ArrowRight") {
        changeSelectedImage(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedImage, changeSelectedImage]);

  const moveGallery = (direction: number) => {
    if (filteredTattoos.length === 0) return;

    setActiveIndex(
      (current) =>
        (current + direction + filteredTattoos.length) %
        filteredTattoos.length
    );
  };

  const getCardPosition = (index: number) => {
    const total = filteredTattoos.length;

    if (!total) return 0;

    let offset = index - activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    return offset;
  };

  /* ---------------- Upload flow ---------------- */

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );

    event.target.value = "";

    if (files.length === 0) return;

    setPendingFiles(files);
    // Start with the file name (without extension). The user can change it.
    setPendingNames(files.map(nameFromFile));
    setShowUploadConfirm(true);
  };

  const changePendingName = (index: number, value: string) => {
    setPendingNames((previous) =>
      previous.map((name, i) => (i === index ? value : name))
    );
  };

  const cancelUpload = () => {
    if (uploading) return;

    setShowUploadConfirm(false);
    setPendingFiles([]);
    setPendingNames([]);
  };

  const confirmUpload = async () => {
    if (uploading || pendingFiles.length === 0) return;

    // Every piercing needs a name.
    if (pendingNames.some((name) => name.trim() === "")) {
      window.alert("Please enter a name for every piercing.");
      return;
    }

    setUploading(true);

    let filesToProcess = [...pendingFiles];
    let namesToProcess = [...pendingNames];

    try {
      while (filesToProcess.length > 0) {
        const file = filesToProcess[0];
        const piercingName =
          (namesToProcess[0] ?? "").trim() || nameFromFile(file);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", piercingName);

        // Uploads are NOT retried automatically (a retry could create
        // duplicates), but they wait long enough for a sleeping server.
        const controller = new AbortController();
        const timer = window.setTimeout(
          () => controller.abort(),
          REQUEST_TIMEOUT_MS * 2
        );

        let response: Response;

        try {
          response = await adminFetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timer);
        }

        if (!response.ok) {
          const message = await response.text().catch(() => "");

          throw new Error(
            message ||
              `Upload failed for "${piercingName}" (${response.status}).`
          );
        }

        const savedPiercing: unknown = await response.json();
        const backendId = getBackendId(savedPiercing);

        if (backendId === null) {
          throw new Error(
            `The server did not return a valid ID for "${piercingName}".`
          );
        }

        const id = `up-${backendId}`;

        const existing = uploadsRef.current.some((item) => item.id === id);

        if (!existing) {
          // Prefer the real server URL so every device sees the same image.
          // Fall back to a local preview only if the server sent no URL.
          const serverSrc = resolveImageSrc(savedPiercing);
          const src = serverSrc ?? createObjectUrl(file);

          const uploadedItem: UploadedImage = {
            id,
            src,
            backendId,
            name: getName(savedPiercing) ?? piercingName,
          };

          uploadsRef.current = [...uploadsRef.current, uploadedItem];

          setUploads((previous) => [...previous, uploadedItem]);

          setOrder((previous) =>
            previous.includes(id) ? previous : [...previous, id]
          );
        }

        // Remove each successful file from the pending queue immediately.
        filesToProcess = filesToProcess.slice(1);
        namesToProcess = namesToProcess.slice(1);
        setPendingFiles(filesToProcess);
        setPendingNames(namesToProcess);
      }

      setPendingFiles([]);
      setPendingNames([]);
      setShowUploadConfirm(false);
    } catch (error) {
      console.error("Piercing upload failed:", error);

      window.alert(
        error instanceof Error
          ? `${error.message}\n\nSuccessfully uploaded images have been kept. You can retry the remaining files.`
          : "Upload failed. Please try again."
      );

      // Keep only the files (and names) that have not yet been processed.
      setPendingFiles(filesToProcess);
      setPendingNames(namesToProcess);
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Reorder flow ---------------- */

  const startReorder = () => {
    setDraftOrder([...displayIds]);
    setIsReordering(true);
    setDragIndex(null);
    setOverIndex(null);
  };

  const moveImage = (from: number, to: number) => {
    if (
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= displayIds.length ||
      to >= displayIds.length
    ) {
      return;
    }

    const next = [...displayIds];
    const [moved] = next.splice(from, 1);

    if (!moved) return;

    next.splice(to, 0, moved);
    setDraftOrder(next);
  };

  const cancelReorder = () => {
    if (savingReorder) return;

    setShowReorderConfirm(false);
    setIsReordering(false);
    setDraftOrder([]);
    setDragIndex(null);
    setOverIndex(null);
  };

  const requestSaveReorder = () => {
    if (!isReordering || savingReorder) return;
    setShowReorderConfirm(true);
  };

  /** Sends the order of uploaded images to the database. */
  const saveBackendOrder = async (orderedIds: string[]) => {
    const backendIds = orderedIds
      .map((id) => itemsById.get(id))
      .filter((item): item is Tattoo =>
        Boolean(item?.uploaded && item.backendId !== undefined)
      )
      .map((item) => item.backendId!);

    // Built-in assets have no database IDs. Only uploaded images
    // are sent to the reorder API.
    if (backendIds.length === 0) return;

    const response = await fetchWithRetry(
      `${API_URL}/reorder`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendIds),
      },
      MAX_ATTEMPTS,
      true
    );

    if (!response.ok) {
      throw new Error(`Could not save the order (${response.status}).`);
    }
  };

  const confirmSaveReorder = async () => {
    if (!isReordering || savingReorder) return;

    setSavingReorder(true);

    try {
      const orderedIds = draftOrder.filter((id) => itemsById.has(id));

      await saveBackendOrder(orderedIds);

      // Keep ids of hidden items at the end so "Restore deleted" still works.
      const fullOrder = [
        ...orderedIds,
        ...order.filter((id) => !orderedIds.includes(id)),
      ];

      await writeSetting(ORDER_KEY, fullOrder);

      setOrder(fullOrder);
      setDraftOrder([]);
      setIsReordering(false);
      setShowReorderConfirm(false);
      setDragIndex(null);
      setOverIndex(null);
    } catch (error) {
      console.error("Could not reorder piercings:", error);

      window.alert(
        error instanceof Error
          ? `${error.message}\n\nYour changes have not been committed.`
          : "Could not save the order. Please try again."
      );
    } finally {
      setSavingReorder(false);
    }
  };

  const restoreDeleted = async () => {
    if (restoring) return;

    setRestoring(true);

    try {
      await writeSetting(HIDDEN_KEY, []);
      setHidden([]);
    } catch (error) {
      console.error("Could not restore deleted images:", error);

      window.alert("Could not restore the deleted images. Please try again.");
    } finally {
      setRestoring(false);
    }
  };

  /* ---------------- Delete flow ---------------- */

  const askDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const cancelDelete = () => {
    if (deleting) return;
    setPendingDeleteId(null);
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    const item = itemsById.get(id);

    // Already removed (for example deleted on another device).
    if (!item) return true;

    if (item.uploaded) {
      if (item.backendId === undefined) {
        window.alert(
          "This image has no server ID, so it cannot be deleted from the server."
        );
        return false;
      }

      try {
        const response = await adminFetch(`${API_URL}/${item.backendId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const message = await response.text().catch(() => "");

          throw new Error(message || `Delete failed (${response.status}).`);
        }
      } catch (error) {
        console.error("Could not delete piercing:", error);

        window.alert(
          error instanceof Error
            ? error.message
            : "Could not delete the image from the server."
        );

        return false;
      }

      releaseObjectUrl(item.image);

      uploadsRef.current = uploadsRef.current.filter(
        (upload) => upload.id !== id
      );

      setUploads((previous) => previous.filter((upload) => upload.id !== id));
    } else {
      // Built-in image: save the "deleted" list on the server so every
      // device hides it.
      const nextHidden = hidden.includes(id) ? hidden : [...hidden, id];

      try {
        await writeSetting(HIDDEN_KEY, nextHidden);
      } catch (error) {
        console.error("Could not save the deleted image:", error);

        window.alert(
          "Could not delete this image on the server. Please check that the backend is running and try again."
        );

        return false;
      }

      setHidden(nextHidden);
    }

    if (selectedImageRef.current?.id === id) {
      selectedImageRef.current = null;
      setSelectedImage(null);
    }

    setOrder((previous) => previous.filter((savedId) => savedId !== id));
    setDraftOrder((previous) => previous.filter((savedId) => savedId !== id));

    return true;
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId || deleting) return;

    setDeleting(true);

    try {
      const deleted = await deleteItem(pendingDeleteId);

      if (deleted) {
        setPendingDeleteId(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  /* ---------------- Carousel pointer controls ---------------- */

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragStartX.current = event.clientX;
    dragDistance.current = 0;
    draggedRef.current = false;
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const distance = event.clientX - dragStartX.current;
    dragDistance.current = distance;

    if (Math.abs(distance) > 8 && !draggedRef.current) {
      draggedRef.current = true;

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional.
      }
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // The pointer may already have been released.
    }

    if (Math.abs(dragDistance.current) > 35) {
      moveGallery(dragDistance.current < 0 ? 1 : -1);
    }

    window.setTimeout(() => {
      draggedRef.current = false;
    }, 100);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragDistance.current = 0;
    draggedRef.current = false;
  };

  // Browser Back closes: lightbox -> View all -> page
  useBackStack((showAll ? 1 : 0) + (selectedImage ? 1 : 0), () => {
    if (selectedImageRef.current) {
      closeLightbox();
    } else if (showAll) {
      setPendingDeleteId(null);
      setShowAll(false);
      setIsReordering(false);
      setDraftOrder([]);
    }
  });

  /* ---------------- Render ---------------- */

  return (
    <section className="wg-page">
      {backgroundImage && (
        <div className="wg-page-background-container" aria-hidden="true">
          <img
            src={backgroundImage.image}
            alt=""
            className="wg-page-background"
            draggable={false}
            decoding="async"
          />
        </div>
      )}

      <div className="wg-page-background-shade" aria-hidden="true" />

      <BackButton
        onClick={() => {
          if (showAll) {
            setPendingDeleteId(null);
            setShowAll(false);
            setIsReordering(false);
            setDraftOrder([]);
          } else {
            onBackToHome();
          }
        }}
        label={showAll ? "Close all images" : "Back to home"}
      />

      {!selectedImage && (
        <div className="wg-actions">
          {!isReordering ? (
            <>
              {admin && (
                <button
                  type="button"
                  className="wg-upload-btn"
                  onClick={openFilePicker}
                  disabled={uploading}
                >
                  Upload
                </button>
              )}

              <button
                type="button"
                className="wg-viewall"
                onClick={() => {
                  setPendingDeleteId(null);
                  setShowAll((previous) => !previous);
                }}
              >
                {showAll ? "Done" : "View all"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="wg-viewall"
                onClick={cancelReorder}
                disabled={savingReorder}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wg-upload-btn"
                onClick={requestSaveReorder}
                disabled={savingReorder}
              >
                Save
              </button>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      {slowLoad && !uploadsReady && !loadError && (
        <div className="wg-status" role="status">
          <p>Waking up the server. This can take up to a minute...</p>
        </div>
      )}

      {loadError && (
        <div className="wg-status" role="status">
          <p>
            Could not load uploaded images. The server may be waking up.
            Retrying automatically...
          </p>

          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {showAll && (
        <div className="wg-all-view">
          <div className="wg-all-toolbar">
         

            <div className="wg-all-toolbar-actions">
             

              {admin && !isReordering && (
                <button
                  type="button"
                  className="wg-all-reset"
                  onClick={startReorder}
                >
                  Reorder
                </button>
              )}
            </div>
          </div>

          <div className="wg-all-grid">
            {filteredTattoos.length === 0 && (
              <p className="wg-all-empty">
                No images. Upload some or restore deleted images.
              </p>
            )}

            {filteredTattoos.map((tattoo, index) => (
              <div
                key={tattoo.id}
                className={`wg-all-item ${
                  dragIndex === index ? "is-dragging" : ""
                } ${
                  overIndex === index && dragIndex !== index ? "is-over" : ""
                }`}
                draggable={isReordering}
                onDragStart={(event) => {
                  if (!isReordering) {
                    event.preventDefault();
                    return;
                  }

                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(event) => {
                  if (!isReordering) return;

                  event.preventDefault();

                  if (overIndex !== index) {
                    setOverIndex(index);
                  }
                }}
                onDrop={(event) => {
                  if (!isReordering) return;

                  event.preventDefault();

                  if (dragIndex !== null) {
                    moveImage(dragIndex, index);
                  }

                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                onClick={() => {
                  if (isReordering) return;

                  setActiveIndex(index);
                  setShowAll(false);
                  openLightbox(tattoo);
                }}
              >
                <img
                  src={tattoo.image}
                  alt={tattoo.name ?? `Piercing artwork ${index + 1}`}
                  draggable={false}
                  decoding="async"
                  loading="lazy"
                />

                <span className="wg-all-number">{index + 1}</span>

                {tattoo.name && (
                  <span style={cardNameStyle("bottom")}>{tattoo.name}</span>
                )}

                {admin && !isReordering && (
                  <button
                    type="button"
                    className="wg-all-remove"
                    aria-label="Delete image"
                    title="Delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      askDelete(tattoo.id);
                    }}
                  >
                    <img src={deleteIcon} alt="" draggable={false} />
                  </button>
                )}

                {isReordering && (
                  <span className="wg-all-move">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      disabled={index === 0}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveImage(index, index - 1);
                      }}
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      aria-label="Move later"
                      disabled={index === filteredTattoos.length - 1}
                      onClick={(event) => {
                        event.stopPropagation();
                        moveImage(index, index + 1);
                      }}
                    >
                      ›
                    </button>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTattoos.length > 0 ? (
        <div className="wg-gallery-area">
          <div
            className={`wg-carousel ${isDragging ? "is-dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onDragStart={(event) => event.preventDefault()}
          >
            <div className="wg-fan-stage">
              {filteredTattoos.map((tattoo, index) => {
                const offset = getCardPosition(index);
                const visible = Math.abs(offset) <= 4;

                const position = visible
                  ? String(offset)
                  : offset < 0
                    ? "far-left"
                    : "far-right";

                return (
                  <article
                    className={`wg-slide ${offset === 0 ? "is-active" : ""}`}
                    data-position={position}
                    key={tattoo.id}
                    aria-hidden={!visible}
                    style={{
                      zIndex: 10 - Math.abs(offset),
                      pointerEvents: visible ? "auto" : "none",
                    }}
                  >
                    <button
                      type="button"
                      className="wg-artwork"
                      tabIndex={visible ? 0 : -1}
                      onClick={() => {
                        if (draggedRef.current || offset !== 0) return;
                        openLightbox(tattoo);
                      }}
                      aria-label={`View piercing artwork ${index + 1}`}
                    >
                      <img
                        src={tattoo.image}
                        alt={tattoo.name ?? `Piercing artwork ${index + 1}`}
                        draggable={false}
                        decoding="async"
                        loading={Math.abs(offset) <= 2 ? "eager" : "lazy"}
                      />

                      <span className="wg-image-shade" />

                     {tattoo.name && (
  <span style={cardNameStyle("bottom")}>{tattoo.name}</span>
)}

                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="wg-empty">
          <span>COMING SOON</span>
          <p>New artwork for this collection is on its way.</p>
        </div>
      )}

      {selectedImage && (
        <div
          className={`wg-lightbox ${isClosing ? "is-closing" : ""}`}
          onClick={closeLightbox}
          role="presentation"
        >
          <img
            className="wg-lightbox-bg"
            src={selectedImage.image}
            alt=""
            aria-hidden="true"
            draggable={false}
          />

          <div className="wg-lightbox-shade" />

          <button
            type="button"
            className="wg-lightbox-close"
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
            aria-label="Close image"
          >
            ×
          </button>

          <img
            key={`foreground-${selectedImage.id}`}
            src={selectedImage.image}
            alt={selectedImage.name ?? "Selected piercing artwork"}
            className="wg-lightbox-img"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />

          {/* Name of the piercing (only uploaded images have one) */}
          <div className="wg-lightbox-caption">
            {selectedImage.name && (
              <span style={lightboxNameStyle}>{selectedImage.name}</span>
            )}
          </div>

          <div className="wg-lightbox-navigation">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                changeSelectedImage(-1);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                changeSelectedImage(1);
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}

      {pendingDeleteId && (
        <div
          className="wg-delete-backdrop"
          onClick={cancelDelete}
          role="presentation"
        >
          <div
            className="wg-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wg-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="wg-delete-title">Are you sure you want to delete?</h2>

            <p>This image will be removed from your gallery.</p>

            <div className="wg-delete-actions">
              <button
                type="button"
                className="wg-delete-cancel"
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wg-delete-submit"
                onClick={() => void confirmDelete()}
                disabled={deleting}
              >
                {deleting ? "Please wait..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload confirmation: enter a name for each piercing.
          No API request is made before Confirm. */}

      {showUploadConfirm && (
        <div
          className="wg-delete-backdrop"
          onClick={cancelUpload}
          role="presentation"
        >
          <div
            className="wg-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wg-upload-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="wg-upload-title">Confirm image upload</h2>

            <p>
              {pendingFiles.length} image
              {pendingFiles.length === 1 ? "" : "s"} selected. Enter a name
              for {pendingFiles.length === 1 ? "the piercing" : "each piercing"}
              , then confirm.
            </p>

            <div style={nameListStyle}>
              {pendingFiles.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`}>
                  <label
                    style={nameLabelStyle}
                    htmlFor={`wg-piercing-name-${index}`}
                  >
                    {file.name}
                  </label>

                  <input
                    id={`wg-piercing-name-${index}`}
                    type="text"
                    style={nameInputStyle}
                    value={pendingNames[index] ?? ""}
                    placeholder="Piercing name"
                    maxLength={100}
                    autoFocus={index === 0}
                    disabled={uploading}
                    onChange={(event) =>
                      changePendingName(index, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <div className="wg-delete-actions">
              <button
                type="button"
                className="wg-delete-cancel"
                onClick={cancelUpload}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wg-delete-submit"
                onClick={() => void confirmUpload()}
                disabled={
                  uploading ||
                  pendingFiles.length === 0 ||
                  pendingNames.some((name) => name.trim() === "")
                }
              >
                {uploading ? "Uploading..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorder confirmation: no PUT request before Confirm. */}

      {showReorderConfirm && (
        <div
          className="wg-delete-backdrop"
          onClick={() => {
            if (!savingReorder) setShowReorderConfirm(false);
          }}
          role="presentation"
        >
          <div
            className="wg-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wg-reorder-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="wg-reorder-title">Save new image order?</h2>

            <p>
              Are you sure you want to save this order? Your changes will be
              applied after confirmation.
            </p>

            <div className="wg-delete-actions">
              <button
                type="button"
                className="wg-delete-cancel"
                onClick={() => setShowReorderConfirm(false)}
                disabled={savingReorder}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wg-delete-submit"
                onClick={() => void confirmSaveReorder()}
                disabled={savingReorder}
              >
                {savingReorder ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(Piercing);