import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import "./work.css";
import cubeBackground from "../../assets/close-up-colorful-cube-pattern-with-black-background-generative-ai_958192-97660.avif";
import deleteIcon from "../../assets/images.png";

import tattoo1 from "../../assets/1.jpg";
import tattoo2 from "../../assets/2.jpg";
import tattoo3 from "../../assets/3.jpg";
import tattoo4 from "../../assets/4.jpg";
import tattoo5 from "../../assets/5.jpg";
import tattoo6 from "../../assets/6.jpg";
import tattoo7 from "../../assets/7.jpg";
import tattoo8 from "../../assets/8.jpg";
import tattoo9 from "../../assets/9.jpg";

import tattoo10 from "../../assets/1g.jpeg";
import tattoo11 from "../../assets/2g.jpg";
import tattoo12 from "../../assets/3g.jpg";
import tattoo13 from "../../assets/4g.jpg";
import tattoo14 from "../../assets/5g.jpg";
import tattoo15 from "../../assets/6g.jpg";
import tattoo16 from "../../assets/7g.jpg";
import tattoo17 from "../../assets/8g.jpg";
import tattoo18 from "../../assets/9g.jpg";

import tattoo19 from "../../assets/1h.jpeg";
import tattoo20 from "../../assets/2h.png";
import tattoo21 from "../../assets/3h.png";
import tattoo22 from "../../assets/4h.jpg";
import tattoo23 from "../../assets/5h.jpg";
import tattoo24 from "../../assets/6h.jpg";
import tattoo25 from "../../assets/7h.jpg";
import tattoo26 from "../../assets/8h.jpg";
import tattoo27 from "../../assets/9h.jpg";
import tattoo28 from "../../assets/10h.jpg";
import tattoo29 from "../../assets/11h.jpeg";

import tattoo30 from "../../assets/1p.jpeg";
import tattoo31 from "../../assets/2p.jpg";
import tattoo32 from "../../assets/3p.jpg";
import tattoo33 from "../../assets/4p.jpg";
import tattoo34 from "../../assets/5p.jpg";
import tattoo35 from "../../assets/6p.jpg";
import tattoo36 from "../../assets/7p.jpg";

interface WorkProps {
  onBackToHome: () => void;
}

interface Tattoo {
  id: string;
  image: string;
  category: string;
  uploaded: boolean;
}

interface UploadedImage {
  id: string;
  category: string;
  src: string;
  backendId?: number;
}

interface Category {
  title: string;
  images: string[];
}

const categories: Category[] = [
  {
    title: "Minimal Line Works",
    images: [
      tattoo1, tattoo2, tattoo3, tattoo4, tattoo5,
      tattoo6, tattoo7, tattoo8, tattoo9,
    ],
  },
  {
    title: "Black & Grey",
    images: [
      tattoo10, tattoo11, tattoo12, tattoo13, tattoo14,
      tattoo15, tattoo16, tattoo17, tattoo18,
    ],
  },
  {
    title: "Healed Works",
    images: [
      tattoo19, tattoo20, tattoo21, tattoo22, tattoo23,
      tattoo24, tattoo25, tattoo26, tattoo27, tattoo28, tattoo29,
    ],
  },
  {
    title: "Portraits & Mini Potraits",
    images: [
      tattoo30, tattoo31, tattoo32, tattoo33,
      tattoo34, tattoo35, tattoo36,
    ],
  },
];

const baseByCategory: Record<string, Tattoo[]> = {};

categories.forEach((category) => {
  baseByCategory[category.title] = category.images.map((image, i) => ({
    id: `base-${i}`,
    image,
    category: category.title,
    uploaded: false,
  }));
});

/* ---------------------------------------------------------
   Backend API
   --------------------------------------------------------- */

const API_URL = `${import.meta.env.VITE_API_URL}/api/tattoos`;

/* ---------------------------------------------------------
   Saved image order + deleted images
   --------------------------------------------------------- */

const ORDER_STORAGE_KEY = "wg-image-order-v2";
const OLD_ORDER_STORAGE_KEY = "wg-image-order-v1";
const HIDDEN_STORAGE_KEY = "wg-image-hidden-v2";
const OLD_HIDDEN_STORAGE_KEY = "wg-image-hidden-v1";

type IdMap = Record<string, string[]>;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

const loadOrders = (): IdMap => {
  const result: IdMap = {};

  try {
    const oldRaw = localStorage.getItem(OLD_ORDER_STORAGE_KEY);

    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Record<string, number[]>;

      categories.forEach((category) => {
        const saved = old?.[category.title];
        const n = category.images.length;

        const valid =
          Array.isArray(saved) &&
          saved.length === n &&
          new Set(saved).size === n &&
          saved.every(
            (i) => Number.isInteger(i) && i >= 0 && i < n
          );

        if (valid) {
          result[category.title] = (saved as number[]).map(
            (i) => `base-${i}`
          );
        }
      });
    }

    const raw = localStorage.getItem(ORDER_STORAGE_KEY);

    if (raw) {
      const saved = JSON.parse(raw);

      if (saved && typeof saved === "object") {
        Object.keys(saved).forEach((key) => {
          if (isStringArray(saved[key])) {
            result[key] = saved[key];
          }
        });
      }
    }
  } catch {
    // Use default order if storage is unavailable or corrupted.
  }

  return result;
};

const loadHidden = (): IdMap => {
  const result: IdMap = {};

  try {
    const oldRaw = localStorage.getItem(OLD_HIDDEN_STORAGE_KEY);

    if (oldRaw) {
      const old = JSON.parse(oldRaw) as Record<string, number[]>;

      categories.forEach((category) => {
        const saved = old?.[category.title];

        if (Array.isArray(saved)) {
          const ids = saved
            .filter((i) => Number.isInteger(i))
            .map((i) => `base-${i}`);

          if (ids.length > 0) {
            result[category.title] = ids;
          }
        }
      });
    }

    const raw = localStorage.getItem(HIDDEN_STORAGE_KEY);

    if (raw) {
      const saved = JSON.parse(raw);

      if (saved && typeof saved === "object") {
        Object.keys(saved).forEach((key) => {
          if (isStringArray(saved[key])) {
            result[key] = saved[key];
          }
        });
      }
    }
  } catch {
    // Use defaults if storage is unavailable or corrupted.
  }

  return result;
};

/* ---------------------------------------------------------
   Uploaded images storage — IndexedDB
   --------------------------------------------------------- */

const DB_NAME = "work-uploads-db";
const STORE_NAME = "images";

interface StoredUpload {
  id: string;
  category: string;
  blob: Blob;
  createdAt: number;
  backendId?: number;
}

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, {
        keyPath: "id",
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const dbGetAll = async (): Promise<StoredUpload[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();

    request.onsuccess = () =>
      resolve(request.result as StoredUpload[]);

    request.onerror = () => reject(request.error);
  });
};

const dbPut = async (item: StoredUpload): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");

    tx.objectStore(STORE_NAME).put(item);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const dbDelete = async (id: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");

    tx.objectStore(STORE_NAME).delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

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
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

/* ---------------------------------------------------------
   Reusable confirmation popup (uses the existing delete
   popup styles, so no new CSS is needed)
   --------------------------------------------------------- */

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  busyLabel?: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  busyLabel = "Please wait...",
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="wg-delete-backdrop"
      onClick={() => {
        if (!busy) onCancel();
      }}
      role="presentation"
    >
      <div
        className="wg-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wg-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="wg-confirm-title">{title}</h2>

        <p>{message}</p>

        <div className="wg-delete-actions">
          <button
            type="button"
            className="wg-delete-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            className="wg-delete-submit"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Work({ onBackToHome }: WorkProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // View-all / reorder state
  const [showAll, setShowAll] = useState(false);
  const [orders, setOrders] = useState<IdMap>(loadOrders);
  const [hidden, setHidden] = useState<IdMap>(loadHidden);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Reorder mode: Reorder -> (Cancel | Save) -> confirm popup -> API
  const [isReordering, setIsReordering] = useState(false);
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [showReorderConfirm, setShowReorderConfirm] = useState(false);
  const [isSavingReorder, setIsSavingReorder] = useState(false);

  // Delete confirmation popup
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload state + confirmation popup
  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [pendingUpload, setPendingUpload] = useState<{
    files: File[];
    category: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef<UploadedImage[]>([]);

  uploadsRef.current = uploads;

  const dragStartX = useRef(0);
  const dragDistance = useRef(0);
  const draggedRef = useRef(false);
  const selectedImageRef = useRef<Tattoo | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  // Load previously uploaded images from IndexedDB.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stored = await dbGetAll();

        if (cancelled) return;

        stored.sort((a, b) => a.createdAt - b.createdAt);

        setUploads(
          stored.map((item) => ({
            id: item.id,
            category: item.category,
            src: URL.createObjectURL(item.blob),
            backendId: item.backendId,
          }))
        );
      } catch {
        // Storage unavailable — uploads won't persist.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Free object URLs when leaving the page.
  useEffect(() => {
    return () => {
      uploadsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.src);
      });
    };
  }, []);

  const hiddenIds = useMemo(
    () => (activeCategory ? hidden[activeCategory] ?? [] : []),
    [activeCategory, hidden]
  );

  // Every visible image in the open category.
  const itemsById = useMemo(() => {
    const map = new Map<string, Tattoo>();

    if (!activeCategory) return map;

    (baseByCategory[activeCategory] ?? []).forEach((item) => {
      if (!hiddenIds.includes(item.id)) {
        map.set(item.id, item);
      }
    });

    uploads
      .filter((item) => item.category === activeCategory)
      .forEach((item) => {
        map.set(item.id, {
          id: item.id,
          image: item.src,
          category: activeCategory,
          uploaded: true,
        });
      });

    return map;
  }, [activeCategory, hiddenIds, uploads]);

  // Saved order first; new images go at the end.
  const displayIds = useMemo(() => {
    if (!activeCategory) return [];

    const seen = new Set<string>();
    const ids: string[] = [];

    (orders[activeCategory] ?? []).forEach((id) => {
      if (itemsById.has(id) && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    });

    itemsById.forEach((_, id) => {
      if (!seen.has(id)) ids.push(id);
    });

    return ids;
  }, [activeCategory, orders, itemsById]);

  const filteredTattoos: Tattoo[] = useMemo(
    () => displayIds.map((id) => itemsById.get(id)!),
    [displayIds, itemsById]
  );

  // Order shown in the "View all" grid — the draft while reordering.
  const gridIds = useMemo(() => {
    if (!isReordering || !draftOrder) return displayIds;

    const seen = new Set<string>();
    const ids: string[] = [];

    draftOrder.forEach((id) => {
      if (itemsById.has(id) && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    });

    displayIds.forEach((id) => {
      if (!seen.has(id)) ids.push(id);
    });

    return ids;
  }, [isReordering, draftOrder, displayIds, itemsById]);

  const gridTattoos: Tattoo[] = useMemo(
    () => gridIds.map((id) => itemsById.get(id)!),
    [gridIds, itemsById]
  );

  const backgroundImage: Tattoo =
    selectedImage ??
    filteredTattoos[activeIndex] ??
    filteredTattoos[0] ?? {
      id: "background",
      image: cubeBackground,
      category: "Background",
      uploaded: false,
    };

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  // Persist the custom order.
  useEffect(() => {
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Storage unavailable.
    }
  }, [orders]);

  // Persist deleted built-in images.
  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(hidden));
    } catch {
      // Storage unavailable.
    }
  }, [hidden]);

  // Close any confirmation popup with Escape.
  useEffect(() => {
    if (!pendingDeleteId && !pendingUpload && !showReorderConfirm) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (pendingDeleteId && !isDeleting) setPendingDeleteId(null);
      if (pendingUpload && !isUploading) setPendingUpload(null);
      if (showReorderConfirm && !isSavingReorder) {
        setShowReorderConfirm(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [
    pendingDeleteId,
    pendingUpload,
    showReorderConfirm,
    isDeleting,
    isUploading,
    isSavingReorder,
  ]);

  // Keep the active slide valid when images are deleted.
  useEffect(() => {
    if (filteredTattoos.length > 0 && activeIndex >= filteredTattoos.length) {
      setActiveIndex(filteredTattoos.length - 1);
    }
  }, [filteredTattoos.length, activeIndex]);

  // Preload and pre-decode the opened category.
  useEffect(() => {
    filteredTattoos.forEach((tattoo) => {
      const image = new Image();
      image.src = tattoo.image;
      image.decode?.().catch(() => {});
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, filteredTattoos.length]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Automatically rotate the carousel.
  useEffect(() => {
    if (
      !activeCategory ||
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
  }, [
    activeCategory,
    isDragging,
    selectedImage,
    showAll,
    filteredTattoos.length,
  ]);

  const openCategory = (category: string) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    selectedImageRef.current = null;
    setSelectedImage(null);
    setIsClosing(false);
    setShowAll(false);
    setPendingDeleteId(null);
    setPendingUpload(null);
    setIsReordering(false);
    setDraftOrder(null);
    setShowReorderConfirm(false);
    setActiveIndex(0);
    setActiveCategory(category);
  };

  const backToCategories = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    selectedImageRef.current = null;
    setSelectedImage(null);
    setIsClosing(false);
    setShowAll(false);
    setPendingDeleteId(null);
    setPendingUpload(null);
    setIsReordering(false);
    setDraftOrder(null);
    setShowReorderConfirm(false);
    setActiveCategory(null);
    setActiveIndex(0);
  };

  const openLightbox = (tattoo: Tattoo) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    selectedImageRef.current = tattoo;
    setIsClosing(false);
    setSelectedImage(tattoo);
  };

  const closeLightbox = () => {
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
  };

  const changeSelectedImage = (direction: number) => {
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
  };

  // Lightbox keyboard controls and scroll locking.
  useEffect(() => {
    if (!selectedImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
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
  }, [selectedImage]);

  const moveGallery = (direction: number) => {
    if (!filteredTattoos.length) return;

    setActiveIndex(
      (current) =>
        (current + direction + filteredTattoos.length) %
        filteredTattoos.length
    );
  };

  /* ---------- Reorder ---------- */

  const clearDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const startReorder = () => {
    setDraftOrder([...displayIds]);
    setIsReordering(true);
    clearDrag();
  };

  const cancelReorder = () => {
    if (isSavingReorder) return;

    setShowReorderConfirm(false);
    setIsReordering(false);
    setDraftOrder(null);
    clearDrag();
  };

  // Moving images only changes the local draft. Nothing is sent to the
  // backend until the user presses Save and then confirms in the popup.
  const moveImage = (from: number, to: number) => {
    if (
      !activeCategory ||
      !isReordering ||
      from === to ||
      from < 0 ||
      to < 0 ||
      from >= gridIds.length ||
      to >= gridIds.length
    ) {
      return;
    }

    const next = [...gridIds];
    const [moved] = next.splice(from, 1);

    if (!moved) return;

    next.splice(to, 0, moved);

    setDraftOrder(next);
  };

  /** Sends the order of uploaded images to PUT /api/tattoos/reorder. */
  const saveBackendOrder = async (orderedIds: string[]) => {
    // Only uploaded images exist in the database, so only they have IDs.
    const orderedBackendIds = orderedIds
      .map((id) => uploads.find((upload) => upload.id === id)?.backendId)
      .filter((id): id is number => id !== undefined);

    if (orderedBackendIds.length === 0) return;

    const response = await fetch(`${API_URL}/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderedBackendIds),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");

      throw new Error(
        errorText || `Server returned status ${response.status}`
      );
    }
  };

  // Reset to the default order (built-in images first, then uploads).
  // While reordering it only changes the draft; Save commits it.
  const resetOrder = async () => {
    if (!activeCategory || isSavingReorder) return;

    const restored = Array.from(itemsById.keys());

    if (isReordering) {
      setDraftOrder(restored);
      clearDrag();
      return;
    }

    const category = activeCategory;

    try {
      await saveBackendOrder(restored);

      setOrders((prev) => ({
        ...prev,
        [category]: restored,
      }));
    } catch (error) {
      console.error("Reset order failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred.";

      window.alert(
        `The order could not be reset on the backend.\n\n${message}`
      );
    }
  };

  // Save button -> opens the confirmation popup (no API call yet).
  const requestSaveReorder = () => {
    if (!isReordering || isSavingReorder) return;
    setShowReorderConfirm(true);
  };

  const cancelSaveOrder = () => {
    if (isSavingReorder) return;
    setShowReorderConfirm(false);
  };

  // Closing "View all" (Done / back arrow) discards any unsaved draft.
  const requestCloseAll = () => {
    if (isSavingReorder) return;

    setPendingDeleteId(null);
    setShowReorderConfirm(false);
    setIsReordering(false);
    setDraftOrder(null);
    clearDrag();
    setShowAll(false);
  };

  // Confirm -> call PUT /api/tattoos/reorder -> done.
  const confirmSaveOrder = async () => {
    if (!activeCategory || !isReordering || isSavingReorder) return;

    const category = activeCategory;
    const newIds = [...gridIds];

    setIsSavingReorder(true);

    try {
      await saveBackendOrder(newIds);

      // Backend accepted it (or there was nothing to send) — commit locally.
      setOrders((prev) => ({
        ...prev,
        [category]: newIds,
      }));

      setDraftOrder(null);
      setIsReordering(false);
      setShowReorderConfirm(false);
      clearDrag();
    } catch (error) {
      console.error("Reorder failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred.";

      window.alert(
        `The new order could not be saved to the backend.\n\n${message}\n\nYour changes are still here — you can try again.`
      );
    } finally {
      setIsSavingReorder(false);
    }
  };

  /* ---------- Upload ---------- */

  const openFilePicker = () => fileInputRef.current?.click();

  // Choosing files only opens the confirmation popup.
  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/")
    );

    // Allow selecting the same file again.
    event.target.value = "";

    if (files.length === 0 || !activeCategory) return;

    setPendingUpload({ files, category: activeCategory });
  };

  const cancelUpload = () => {
    if (isUploading) return;
    setPendingUpload(null);
  };

  // Confirm → call POST /api/tattoos/upload for each selected file.
  const confirmUpload = async () => {
    if (!pendingUpload || isUploading) return;

    const { files, category } = pendingUpload;
    const added: UploadedImage[] = [];

    setIsUploading(true);

    for (const file of files) {
      try {
        // Upload the file to Spring Boot first so it receives a database ID.
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("description", category);

        const response = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            errorText || `Upload failed (${response.status})`
          );
        }

        const result: { id?: number | string } = await response.json();

        if (result.id === undefined || result.id === null) {
          throw new Error(
            "The upload API did not return an image ID. Check the response from POST /api/tattoos/upload."
          );
        }

        const backendId = Number(result.id);

        if (!Number.isFinite(backendId)) {
          throw new Error("The backend returned an invalid image ID.");
        }

        const id = `up-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        const src = URL.createObjectURL(file);

        const uploadedImage: UploadedImage = {
          id,
          category,
          src,
          backendId,
        };

        try {
          await dbPut({
            id,
            category,
            blob: file,
            createdAt: Date.now(),
            backendId,
          });
        } catch {
          // It remains visible for this session if IndexedDB is unavailable.
        }

        added.push(uploadedImage);
      } catch (error) {
        console.error("Tattoo upload failed:", error);

        const message =
          error instanceof Error
            ? error.message
            : "An unknown error occurred.";

        window.alert(
          `Could not upload "${file.name}" to the backend.\n\n${message}`
        );
      }
    }

    if (added.length > 0) {
      setUploads((prev) => [...prev, ...added]);
    }

    setIsUploading(false);
    setPendingUpload(null);
  };

  /* ---------- Delete ---------- */

  // Clicking the delete icon only opens the confirmation popup.
  const askDelete = (id: string) => {
    if (isDeleting) return;
    setPendingDeleteId(id);
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setPendingDeleteId(null);
  };

  // Submit the confirmation popup to delete the image.
  const deleteItem = async (id: string) => {
    const item = itemsById.get(id);

    if (!item || !activeCategory || isDeleting) return;

    const category = activeCategory;

    if (item.uploaded) {
      const uploadedItem = uploads.find((upload) => upload.id === id);

      if (!uploadedItem) {
        window.alert("Could not find this uploaded image.");
        return;
      }

      /*
       * Only call the backend when this image has a saved backend ID.
       * Older uploads created before backend integration may not have one.
       */
      if (uploadedItem.backendId !== undefined) {
        setIsDeleting(true);

        try {
          const response = await fetch(
            `${API_URL}/${uploadedItem.backendId}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            const errorText = await response.text().catch(() => "");

            throw new Error(
              errorText ||
                `Server returned status ${response.status}`
            );
          }
        } catch (error) {
          console.error("Backend tattoo deletion failed:", error);

          const message =
            error instanceof Error
              ? error.message
              : "An unknown error occurred.";

          window.alert(
            `The image could not be deleted from the backend.\n\n${message}\n\nThe image has been kept in your gallery.`
          );

          return;
        } finally {
          setIsDeleting(false);
        }
      }

      /*
       * Remove the local image only after the backend delete succeeds.
       * If it is an older local-only upload without a backend ID,
       * remove it from this browser as before.
       */
      try {
        await dbDelete(id);
      } catch (error) {
        console.error("Could not delete the local IndexedDB record:", error);
      }

      URL.revokeObjectURL(uploadedItem.src);

      setUploads((prev) => prev.filter((upload) => upload.id !== id));

      if (selectedImageRef.current?.id === id) {
        selectedImageRef.current = null;
        setSelectedImage(null);
        setIsClosing(false);
      }
    } else {
      // Built-in image: preserve the existing browser-only hide behaviour.
      setHidden((prev) => {
        const list = prev[category] ?? [];

        if (list.includes(id)) return prev;

        return {
          ...prev,
          [category]: [...list, id],
        };
      });

      if (selectedImageRef.current?.id === id) {
        selectedImageRef.current = null;
        setSelectedImage(null);
        setIsClosing(false);
      }
    }

    setOrders((prev) => {
      const list = prev[category];

      if (!list) return prev;

      return {
        ...prev,
        [category]: list.filter((itemId) => itemId !== id),
      };
    });

    setDraftOrder((prev) =>
      prev ? prev.filter((itemId) => itemId !== id) : prev
    );
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;

    if (!id || isDeleting) return;

    await deleteItem(id);

    setPendingDeleteId(null);
  };

  const restoreDeleted = () => {
    if (!activeCategory) return;

    setHidden((prev) => {
      const copy = { ...prev };
      delete copy[activeCategory];
      return copy;
    });
  };

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
        // Pointer capture may not be available.
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
      // Pointer may already have been released.
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

  const getCardPosition = (index: number) => {
    const total = filteredTattoos.length;

    if (!total) return 0;

    let offset = index - activeIndex;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    return offset;
  };

  return (
    <section className="wg-page">
      {/* Background follows the current artwork. */}
      {backgroundImage && (
        <div
          className="wg-page-background-container"
          aria-hidden="true"
        >
          <img
            key={backgroundImage.image}
            src={backgroundImage.image}
            alt=""
            className="wg-page-background"
            draggable={false}
            decoding="async"
          />
        </div>
      )}

      <div
        className="wg-page-background-shade"
        aria-hidden="true"
      />

      {/* BACK BUTTON */}
      <BackButton
        onClick={
          showAll
            ? requestCloseAll
            : activeCategory
              ? backToCategories
              : onBackToHome
        }
        label={
          showAll
            ? "Close all images"
            : activeCategory
              ? "Back to categories"
              : "Back to home"
        }
      />

      {/* UPLOAD + VIEW ALL / DONE, or CANCEL + SAVE while reordering */}
      {activeCategory && !selectedImage && (
        <div className="wg-actions">
          {isReordering ? (
            <>
              <button
                type="button"
                className="wg-viewall"
                onClick={cancelReorder}
                disabled={isSavingReorder}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wg-upload-btn"
                onClick={requestSaveReorder}
                disabled={isSavingReorder}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="wg-upload-btn"
                onClick={openFilePicker}
              >
                Upload
              </button>

              {(filteredTattoos.length > 0 || hiddenIds.length > 0) && (
                <button
                  type="button"
                  className="wg-viewall"
                  onClick={() => {
                    if (showAll) {
                      requestCloseAll();
                    } else {
                      setPendingDeleteId(null);
                      setShowAll(true);
                    }
                  }}
                >
                  {showAll ? "Done" : "View all"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Hidden file picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFiles}
      />

      {/* VIEW ALL + REORDER GRID */}
      {activeCategory && showAll && (
        <div className="wg-all-view">
          <div className="wg-all-toolbar">
            <p>
              {isReordering
                ? "Drag images to rearrange them, then press Save."
                : "Click an image to open it in the gallery. Use Reorder to change the order."}
            </p>

            <div className="wg-all-toolbar-actions">
              {hiddenIds.length > 0 && !isReordering && (
                <button
                  type="button"
                  className="wg-all-reset"
                  onClick={restoreDeleted}
                >
                  Restore deleted
                </button>
              )}

              <button
                type="button"
                className="wg-all-reset"
                onClick={() => void resetOrder()}
                disabled={isSavingReorder}
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
            {gridTattoos.length === 0 && (
              <p className="wg-all-empty">
                No images. Upload some, or restore deleted ones.
              </p>
            )}

            {gridTattoos.map((tattoo, index) => (
              <div
                key={tattoo.id}
                className={`wg-all-item ${
                  dragIndex === index ? "is-dragging" : ""
                } ${
                  overIndex === index && dragIndex !== index
                    ? "is-over"
                    : ""
                }`}
                draggable={isReordering}
                onDragStart={(event) => {
                  if (!isReordering) {
                    event.preventDefault();
                    return;
                  }

                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData(
                    "text/plain",
                    String(index)
                  );
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

                  clearDrag();
                }}
                onDragEnd={clearDrag}
                onClick={() => {
                  if (isReordering) return;

                  const carouselIndex = filteredTattoos.findIndex(
                    (item) => item.id === tattoo.id
                  );

                  setActiveIndex(carouselIndex >= 0 ? carouselIndex : 0);
                  setShowAll(false);
                }}
              >
                <img
                  src={tattoo.image}
                  alt={`${tattoo.category} artwork ${index + 1}`}
                  draggable={false}
                  decoding="async"
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
                    <img
                      src={deleteIcon}
                      alt=""
                      draggable={false}
                    />
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
                      disabled={index === gridTattoos.length - 1}
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

      {/* FIRST SCREEN: FOUR CATEGORY CARDS */}
      {!activeCategory ? (
        <section className="wg-category-screen">
          <div className="wg-category-heading">
            <h1>
              EXPLORE <em>THE WORK</em>
            </h1>
          </div>

          <div className="wg-category-grid">
            {categories.map((category, index) => (
              <button
                type="button"
                key={category.title}
                className={`wg-category-card wg-category-card-${index + 1}`}
                onClick={() => openCategory(category.title)}
              >
                <img
                  src={category.images[0]}
                  alt={category.title}
                  className="wg-category-image"
                  draggable={false}
                />

                <span className="wg-category-overlay" />

                <span className="wg-category-content">
                  <strong>{category.title}</strong>
                  <span className="wg-category-subtitle" />
                  <span className="wg-category-explore">
                    EXPLORE WORK
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : filteredTattoos.length > 0 ? (
        /* 3D CAROUSEL */
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
                    className={`wg-slide ${
                      offset === 0 ? "is-active" : ""
                    }`}
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
                        if (draggedRef.current) return;

                        if (offset !== 0) {
                          setActiveIndex(index);
                          return;
                        }

                        openLightbox(tattoo);
                      }}
                      aria-label={`View ${tattoo.category} artwork ${
                        index + 1
                      }`}
                    >
                      <img
                        src={tattoo.image}
                        alt={`${tattoo.category} artwork ${index + 1}`}
                        draggable={false}
                        decoding="async"
                        loading="eager"
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

      {/* FULL-SCREEN LIGHTBOX */}
      {selectedImage !== null && (
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
            alt={`${selectedImage.category} tattoo`}
            className="wg-lightbox-img"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />

          <div className="wg-lightbox-caption">
            {selectedImage.category}
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

      {/* DELETE CONFIRMATION POPUP */}
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
            <h2 id="wg-delete-title">
              Are you sure you want to delete?
            </h2>

            <p>This image will be removed from your gallery.</p>

            <div className="wg-delete-actions">
              <button
                type="button"
                className="wg-delete-cancel"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="wg-delete-submit"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD CONFIRMATION POPUP */}
      {pendingUpload && (
        <ConfirmDialog
          title="Upload to your gallery?"
          message={
            pendingUpload.files.length === 1
              ? `"${pendingUpload.files[0].name}" will be uploaded to ${pendingUpload.category}.`
              : `${pendingUpload.files.length} images will be uploaded to ${pendingUpload.category}.`
          }
          confirmLabel="Confirm"
          busyLabel="Uploading..."
          busy={isUploading}
          onConfirm={confirmUpload}
          onCancel={cancelUpload}
        />
      )}

      {/* REORDER CONFIRMATION POPUP: no PUT request before Confirm. */}
      {showReorderConfirm && (
        <ConfirmDialog
          title="Save the new order?"
          message="The new image order will be saved."
          confirmLabel="Confirm"
          busyLabel="Saving..."
          busy={isSavingReorder}
          onConfirm={confirmSaveOrder}
          onCancel={cancelSaveOrder}
        />
      )}
    </section>
  );
}

export default Work;