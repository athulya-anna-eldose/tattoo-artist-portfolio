import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, PointerEvent } from "react";
import "./piercing.css";

import deleteIcon from "../../assets/images.png";

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

interface PiercingProps {
  onBackToHome: () => void;
}

interface Tattoo {
  id: string;
  image: string;
  category?: string;
  uploaded: boolean;
  backendId?: number;
}

interface UploadedImage {
  id: string;
  src: string;
  backendId: number;
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
  const response = await fetch(`${SETTINGS_BASE}/${key}`);

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
  const response = await fetch(`${SETTINGS_BASE}/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value: JSON.stringify(ids) }),
  });

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

/* ---------------- Gallery component ---------------- */

function Piercing({ onBackToHome }: PiercingProps) {
  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [showAll, setShowAll] = useState(false);
  const [order, setOrder] = useState<string[]>(loadOrder);
  const [draftOrder, setDraftOrder] = useState<string[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [hidden, setHidden] = useState<string[]>(loadHidden);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [uploadsReady, setUploadsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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
    if (!silent) setLoadError(false);

    try {
      const [response, serverOrder, serverHidden] = await Promise.all([
        fetch(API_URL),
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

      // Do not change the screen while the user is in the middle of
      // reordering, uploading or deleting.
      if (silent && busyRef.current) return;

      const loaded: UploadedImage[] = [];

      data.forEach((entry) => {
        const backendId = getBackendId(entry);
        const src = resolveImageSrc(entry);

        if (backendId === null || !src) return;

        loaded.push({
          id: `up-${backendId}`,
          src,
          backendId,
        });
      });

      setUploads((previous) => (sameJson(previous, loaded) ? previous : loaded));

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

      if (!silent) setLoadError(true);
    } finally {
      setUploadsReady(true);
    }
  }, []);

  // First load (and "Try again").
  useEffect(() => {
    void syncFromServer(false);
  }, [syncFromServer, reloadKey]);

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

  /* Automatically rotate the carousel. */

  useEffect(() => {
    if (
      isDragging ||
      selectedImage ||
      showAll ||
      filteredTattoos.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filteredTattoos.length);
    }, 2400);

    return () => window.clearInterval(timer);
  }, [isDragging, selectedImage, showAll, filteredTattoos.length]);

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
    setShowUploadConfirm(true);
  };

  const cancelUpload = () => {
    if (uploading) return;

    setShowUploadConfirm(false);
    setPendingFiles([]);
  };

  const confirmUpload = async () => {
    if (uploading || pendingFiles.length === 0) return;

    setUploading(true);

    let filesToProcess = [...pendingFiles];

    try {
      while (filesToProcess.length > 0) {
        const file = filesToProcess[0];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

        const response = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const message = await response.text().catch(() => "");

          throw new Error(
            message ||
              `Upload failed for "${file.name}" (${response.status}).`
          );
        }

        const savedPiercing: unknown = await response.json();
        const backendId = getBackendId(savedPiercing);

        if (backendId === null) {
          throw new Error(
            `The server did not return a valid ID for "${file.name}".`
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
          };

          uploadsRef.current = [...uploadsRef.current, uploadedItem];

          setUploads((previous) => [...previous, uploadedItem]);

          setOrder((previous) =>
            previous.includes(id) ? previous : [...previous, id]
          );
        }

        // Remove each successful file from the pending queue immediately.
        filesToProcess = filesToProcess.slice(1);
        setPendingFiles(filesToProcess);
      }

      setPendingFiles([]);
      setShowUploadConfirm(false);
    } catch (error) {
      console.error("Piercing upload failed:", error);

      window.alert(
        error instanceof Error
          ? `${error.message}\n\nSuccessfully uploaded images have been kept. You can retry the remaining files.`
          : "Upload failed. Please try again."
      );

      // Keep only the files that have not yet been processed.
      setPendingFiles(filesToProcess);
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

    const response = await fetch(`${API_URL}/reorder`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendIds),
    });

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

  const resetOrder = async () => {
    const uploadedIds = uploads.map((item) => item.id);

    const restoredOrder = [
      ...defaultOrder.filter((id) => itemsById.has(id)),
      ...uploadedIds.filter((id) => itemsById.has(id)),
    ];

    // While reordering, Reset only changes the draft. Save commits it.
    if (isReordering) {
      setDraftOrder(restoredOrder);
      return;
    }

    try {
      await saveBackendOrder(restoredOrder);
      await writeSetting(ORDER_KEY, restoredOrder);

      setOrder(restoredOrder);
    } catch (error) {
      console.error("Could not reset the order:", error);

      window.alert(
        "Could not reset the order on the server. Please check that the backend is running and try again."
      );
    }
  };

  const restoreDeleted = async () => {
    try {
      await writeSetting(HIDDEN_KEY, []);
      setHidden([]);
    } catch (error) {
      console.error("Could not restore deleted images:", error);

      window.alert("Could not restore the deleted images. Please try again.");
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
        const response = await fetch(`${API_URL}/${item.backendId}`, {
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
              <button
                type="button"
                className="wg-upload-btn"
                onClick={openFilePicker}
                disabled={uploading}
              >
                Upload
              </button>

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

      {loadError && (
        <div className="wg-status" role="status">
          <p>Could not load uploaded images. The server may be waking up.</p>

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
            <p>
              {isReordering
                ? "Drag images to rearrange them, then press Save."
                : "Click an image to view it. Use Reorder to change the order."}
            </p>

            <div className="wg-all-toolbar-actions">
              {hidden.length > 0 && !isReordering && (
                <button
                  type="button"
                  className="wg-all-reset"
                  onClick={() => void restoreDeleted()}
                >
                  Restore deleted
                </button>
              )}

              <button
                type="button"
                className="wg-all-reset"
                onClick={() => void resetOrder()}
                disabled={savingReorder}
              >
                Reset
              </button>

              {!isReordering && (
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
                  alt={`Piercing artwork ${index + 1}`}
                  draggable={false}
                  decoding="async"
                  loading="lazy"
                />

                <span className="wg-all-number">{index + 1}</span>

                {!isReordering && (
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
                        alt={`Piercing artwork ${index + 1}`}
                        draggable={false}
                        decoding="async"
                        loading={Math.abs(offset) <= 2 ? "eager" : "lazy"}
                      />

                      <span className="wg-image-shade" />

                      <span className="wg-artwork-info">
                        <small>
                          {String(index + 1).padStart(2, "0")}
                          {" / "}
                          {String(filteredTattoos.length).padStart(2, "0")}
                        </small>
                      </span>
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
            alt="Selected piercing artwork"
            className="wg-lightbox-img"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />

          <div className="wg-lightbox-caption" />

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

      {/* Upload confirmation: no API request before Confirm. */}

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
              {pendingFiles.length === 1 ? "" : "s"} selected. Do you want to
              upload
              {pendingFiles.length === 1 ? " this image" : " these images"}?
            </p>

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
                disabled={uploading || pendingFiles.length === 0}
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