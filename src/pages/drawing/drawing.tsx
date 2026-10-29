
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ChangeEvent } from "react";
import "./drawing.css";

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

const drawings = [
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
];

interface GalleryItem {
  id: string;
  src: string;
  uploaded: boolean;
  backendId?: number;
}

interface UploadedImage {
  id: string;
  src: string;
  backendId?: number;
}

interface StoredUpload {
  id: string;
  blob: Blob;
  createdAt: number;
  backendId?: number;
}

interface DrawingsProps {
  onBackToHome: () => void;
}

type ViewMode = "marquee" | "all";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/drawings`;
const ORDER_STORAGE_KEY = "drawings-order-v2";
const OLD_ORDER_STORAGE_KEY = "drawings-order-v1";
const HIDDEN_STORAGE_KEY = "drawings-hidden-v1";

const DB_NAME = "drawings-uploads-db";
const STORE_NAME = "images";

const baseItems: GalleryItem[] = drawings.map((src, index) => ({
  id: `base-${index}`,
  src,
  uploaded: false,
}));

const defaultOrder = baseItems.map((item) => item.id);

/* ---------------------------------------------------------
   Local storage
   --------------------------------------------------------- */

const loadOrder = (): string[] => {
  try {
    const saved = localStorage.getItem(ORDER_STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (
        Array.isArray(parsed) &&
        parsed.every((id) => typeof id === "string")
      ) {
        return parsed;
      }
    }

    const oldSaved = localStorage.getItem(OLD_ORDER_STORAGE_KEY);

    if (oldSaved) {
      const parsed: unknown = JSON.parse(oldSaved);

      if (
        Array.isArray(parsed) &&
        parsed.length === drawings.length &&
        new Set(parsed).size === drawings.length &&
        parsed.every(
          (index) =>
            Number.isInteger(index) &&
            index >= 0 &&
            index < drawings.length
        )
      ) {
        return (parsed as number[]).map(
          (index) => `base-${index}`
        );
      }
    }
  } catch (error) {
    console.error("Could not load drawing order:", error);
  }

  return defaultOrder;
};

const loadHidden = (): string[] => {
  try {
    const saved = localStorage.getItem(HIDDEN_STORAGE_KEY);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    if (
      Array.isArray(parsed) &&
      parsed.every((id) => typeof id === "string")
    ) {
      return parsed;
    }
  } catch (error) {
    console.error("Could not load hidden drawings:", error);
  }

  return [];
};

/* ---------------------------------------------------------
   IndexedDB
   --------------------------------------------------------- */

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const dbGetAll = async (): Promise<StoredUpload[]> => {
  const db = await openDB();

  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();

      request.onsuccess = () =>
        resolve(request.result as StoredUpload[]);

      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

const dbPut = async (item: StoredUpload): Promise<void> => {
  const db = await openDB();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");

      tx.objectStore(STORE_NAME).put(item);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

const dbDelete = async (id: string): Promise<void> => {
  const db = await openDB();

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");

      tx.objectStore(STORE_NAME).delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

/* ---------------------------------------------------------
   Shared UI components
   --------------------------------------------------------- */

interface BackButtonProps {
  onClick: () => void;
}

const BackButton = ({ onClick }: BackButtonProps) => (
  <button
    type="button"
    className="drawings-back-btn"
    onClick={onClick}
    aria-label="Go back"
    title="Back"
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

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}

const ConfirmModal = ({
  title,
  message,
  confirmText,
  busy = false,
  onCancel,
  onConfirm,
  children,
}: ConfirmModalProps) => (
  <div
    className="delete-modal-backdrop"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) {
        onCancel();
      }
    }}
    role="presentation"
  >
    <div
      className="delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawing-confirm-title"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <h2 id="drawing-confirm-title">{title}</h2>

      <p>{message}</p>

      {children}

      <div className="delete-modal-actions">
        <button
          type="button"
          className="delete-modal-cancel"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>

        <button
          type="button"
          className="delete-modal-submit"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? "Please wait..." : confirmText}
        </button>
      </div>
    </div>
  </div>
);

/* ---------------------------------------------------------
   Infinite marquee
   --------------------------------------------------------- */

interface MarqueeRowProps {
  items: GalleryItem[];
  reverse?: boolean;
  label: string;
  onOpen: (src: string) => void;
}

const SECONDS_PER_CARD = 6;
const MIN_CARDS_PER_HALF = 6;

const MarqueeRow = memo(function MarqueeRow({
  items,
  reverse = false,
  label,
  onOpen,
}: MarqueeRowProps) {
  const half = useMemo(() => {
    if (items.length === 0) return [];

    const repetitions = Math.max(
      1,
      Math.ceil(MIN_CARDS_PER_HALF / items.length)
    );

    return Array.from(
      { length: repetitions },
      () => items
    ).flat();
  }, [items]);

  const duration = half.length * SECONDS_PER_CARD;

  if (half.length === 0) return null;

  return (
    <div className="marquee-row" role="list" aria-label={label}>
      <div
        className={`marquee-track ${reverse ? "is-reverse" : ""}`}
        style={
          { "--duration": `${duration}s` } as CSSProperties
        }
      >
        {[0, 1].map((copy) =>
          half.map((item, index) => (
            <div
              className="marquee-card"
              key={`${copy}-${item.id}-${index}`}
              role="listitem"
              aria-hidden={copy === 1}
            >
              <button
                type="button"
                className="drawing-open"
                onClick={() => onOpen(item.src)}
                aria-label="View drawing"
                tabIndex={copy === 1 ? -1 : 0}
              >
                <img
                  src={item.src}
                  alt="Tattoo drawing"
                  loading={copy === 0 && index < 4 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />

                <span className="drawing-card-overlay" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

/* ---------------------------------------------------------
   Main page
   --------------------------------------------------------- */

export default function Drawings({
  onBackToHome,
}: DrawingsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    null
  );

  const [view, setView] = useState<ViewMode>("marquee");

  const [order, setOrder] = useState<string[]>(loadOrder);
  const [hidden, setHidden] = useState<string[]>(loadHidden);

  const [uploads, setUploads] = useState<UploadedImage[]>([]);
  const [uploadsReady, setUploadsReady] = useState(false);

  const [isReordering, setIsReordering] = useState(false);
  const [draft, setDraft] = useState<string[] | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(
    null
  );

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showReorderConfirm, setShowReorderConfirm] = useState(false);
  const [savingReorder, setSavingReorder] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef<UploadedImage[]>([]);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  uploadsRef.current = uploads;

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

  // Load local uploads once.
  useEffect(() => {
    let cancelled = false;

    const loadUploads = async () => {
      try {
        const stored = await dbGetAll();

        stored.sort((a, b) => a.createdAt - b.createdAt);

        if (cancelled) return;

        const loaded = stored.map((item) => ({
          id: item.id,
          src: createObjectUrl(item.blob),
          backendId: item.backendId,
        }));

        setUploads(loaded);
      } catch (error) {
        console.error("Could not load cached drawings:", error);
      } finally {
        if (!cancelled) setUploadsReady(true);
      }
    };

    void loadUploads();

    return () => {
      cancelled = true;
    };
  }, [createObjectUrl]);

  // Release all local image URLs when the component unmounts.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  const itemsById = useMemo(() => {
    const map = new Map<string, GalleryItem>();

    baseItems.forEach((item) => {
      if (!hidden.includes(item.id)) {
        map.set(item.id, item);
      }
    });

    uploads.forEach((item) => {
      map.set(item.id, {
        id: item.id,
        src: item.src,
        uploaded: true,
        backendId: item.backendId,
      });
    });

    return map;
  }, [uploads, hidden]);

  const displayIds = useMemo(() => {
    const result: string[] = [];
    const seen = new Set<string>();

    order.forEach((id) => {
      if (itemsById.has(id) && !seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    });

    itemsById.forEach((_, id) => {
      if (!seen.has(id)) result.push(id);
    });

    return result;
  }, [order, itemsById]);

  const visibleIds = useMemo(() => {
    if (isReordering && draft) {
      const validDraft = draft.filter((id) => itemsById.has(id));
      const seen = new Set(validDraft);

      itemsById.forEach((_, id) => {
        if (!seen.has(id)) validDraft.push(id);
      });

      return validDraft;
    }

    return displayIds;
  }, [isReordering, draft, displayIds, itemsById]);

  const gridItems = useMemo(
    () =>
      visibleIds
        .map((id) => itemsById.get(id))
        .filter((item): item is GalleryItem => Boolean(item)),
    [visibleIds, itemsById]
  );

  const orderedDrawings = useMemo(
    () =>
      displayIds
        .map((id) => itemsById.get(id))
        .filter((item): item is GalleryItem => Boolean(item)),
    [displayIds, itemsById]
  );

  const rowTop = useMemo(
    () => orderedDrawings.filter((_, index) => index % 2 === 0),
    [orderedDrawings]
  );

  const rowBottom = useMemo(
    () => orderedDrawings.filter((_, index) => index % 2 === 1),
    [orderedDrawings]
  );

  // Save the gallery order only after IndexedDB has finished loading.
  useEffect(() => {
    if (!uploadsReady) return;

    try {
      localStorage.setItem(
        ORDER_STORAGE_KEY,
        JSON.stringify(displayIds)
      );
    } catch (error) {
      console.error("Could not save drawing order:", error);
    }
  }, [displayIds, uploadsReady]);

  useEffect(() => {
    try {
      localStorage.setItem(
        HIDDEN_STORAGE_KEY,
        JSON.stringify(hidden)
      );
    } catch (error) {
      console.error("Could not save hidden drawings:", error);
    }
  }, [hidden]);

  // Escape closes an open modal or the image preview.
  useEffect(() => {
    const hasModal =
      pendingDeleteId !== null ||
      showUploadConfirm ||
      showReorderConfirm;

    if (!hasModal && !selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (uploading || savingReorder || deleting) return;

      if (showUploadConfirm) {
        setShowUploadConfirm(false);
        setPendingFiles([]);
      } else if (showReorderConfirm) {
        setShowReorderConfirm(false);
      } else if (pendingDeleteId) {
        setPendingDeleteId(null);
      } else {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    pendingDeleteId,
    showUploadConfirm,
    showReorderConfirm,
    selectedImage,
    uploading,
    savingReorder,
    deleting,
  ]);

  /* -------------------------------------------------------
     View controls
     ------------------------------------------------------- */

  const clearDrag = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const openFilePicker = useCallback(() => {
    if (uploading) return;
    fileInputRef.current?.click();
  }, [uploading]);

  const openViewAll = useCallback(() => {
    setView("all");
    clearDrag();
  }, [clearDrag]);

  const startReorder = useCallback(() => {
    setDraft([...displayIds]);
    setIsReordering(true);
    clearDrag();
  }, [displayIds, clearDrag]);

  const cancelReorder = useCallback(() => {
    setDraft(null);
    setIsReordering(false);
    setShowReorderConfirm(false);
    clearDrag();
  }, [clearDrag]);

  const handleBack = useCallback(() => {
    if (uploading || savingReorder || deleting) return;

    if (showUploadConfirm) {
      setShowUploadConfirm(false);
      setPendingFiles([]);
      return;
    }

    if (showReorderConfirm) {
      setShowReorderConfirm(false);
      return;
    }

    if (pendingDeleteId) {
      setPendingDeleteId(null);
      return;
    }

    if (selectedImage) {
      setSelectedImage(null);
      return;
    }

    if (view === "all") {
      cancelReorder();
      setView("marquee");
    } else {
      onBackToHome();
    }
  }, [
    uploading,
    savingReorder,
    deleting,
    showUploadConfirm,
    showReorderConfirm,
    pendingDeleteId,
    selectedImage,
    view,
    cancelReorder,
    onBackToHome,
  ]);

  const moveImage = useCallback(
    (from: number, to: number) => {
      if (
        !isReordering ||
        from === to ||
        from < 0 ||
        to < 0 ||
        from >= visibleIds.length ||
        to >= visibleIds.length
      ) {
        return;
      }

      const next = [...visibleIds];
      const [moved] = next.splice(from, 1);

      if (!moved) return;

      next.splice(to, 0, moved);
      setDraft(next);
    },
    [isReordering, visibleIds]
  );

  // Reset the order to the original built-in order, followed by uploads.
  const resetOrder = useCallback(async () => {
    if (isReordering || savingReorder) return;

    const next = [
      ...defaultOrder.filter((id) => itemsById.has(id)),
      ...uploads
        .map((item) => item.id)
        .filter((id) => itemsById.has(id)),
    ];

    const backendIds = next
      .map((id) => itemsById.get(id))
      .filter(
        (item): item is GalleryItem =>
          Boolean(item?.uploaded && item.backendId != null)
      )
      .map((item) => item.backendId as number);

    try {
      if (backendIds.length > 0) {
        const response = await fetch(`${API_BASE}/reorder`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendIds),
        });

        if (!response.ok) {
          throw new Error(`Reset failed: ${response.status}`);
        }
      }

      setOrder(next);
      setDraft(null);
      clearDrag();
    } catch (error) {
      console.error("Could not reset drawing order:", error);
      alert(
        "Could not reset the order on the server. Please check that the backend is running and try again."
      );
    }
  }, [
    isReordering,
    savingReorder,
    itemsById,
    uploads,
    clearDrag,
  ]);

  const restoreDeleted = useCallback(() => {
    setHidden([]);
  }, []);

  /* -------------------------------------------------------
     Upload flow: select -> confirm -> upload
     ------------------------------------------------------- */

  const handleFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []).filter(
        (file) => file.type.startsWith("image/")
      );

      // Allow selecting the same file again later.
      event.target.value = "";

      if (selected.length === 0) return;

      setPendingFiles(selected);
      setShowUploadConfirm(true);
    },
    []
  );

  const cancelUpload = useCallback(() => {
    if (uploading) return;

    setShowUploadConfirm(false);
    setPendingFiles([]);
  }, [uploading]);

  const confirmUpload = useCallback(async () => {
    if (uploading || pendingFiles.length === 0) return;

    setUploading(true);

    try {
      for (let index = 0; index < pendingFiles.length; index++) {
        const file = pendingFiles[index];
        const formData = new FormData();

        formData.append("file", file);
        formData.append("name", file.name);

        let response: Response;

        try {
          response = await fetch(`${API_BASE}/upload`, {
            method: "POST",
            body: formData,
          });
        } catch {
          setPendingFiles(pendingFiles.slice(index));
          alert(
            `Could not connect to the backend while uploading "${file.name}". The remaining files are still selected.`
          );
          return;
        }

        if (!response.ok) {
          const message = await response.text().catch(() => "");

          setPendingFiles(pendingFiles.slice(index));

          alert(
            `Could not upload "${file.name}". ${
              message || `Server status: ${response.status}`
            }`
          );
          return;
        }

        let savedDrawing: { id?: unknown };

        try {
          savedDrawing = await response.json();
        } catch {
          setPendingFiles(pendingFiles.slice(index + 1));
          alert(
            `The server accepted "${file.name}" but returned an invalid response. Check the backend upload response before retrying.`
          );
          return;
        }

        const backendId = Number(savedDrawing.id);

        if (!Number.isInteger(backendId) || backendId <= 0) {
          setPendingFiles(pendingFiles.slice(index + 1));
          alert(
            `The server response for "${file.name}" does not contain a valid drawing ID. Check your upload API response.`
          );
          return;
        }

        const id = `up-${backendId}`;

        // Avoid duplicates if an upload response was already cached.
        if (uploadsRef.current.some((item) => item.id === id)) {
          setPendingFiles(pendingFiles.slice(index + 1));
          continue;
        }

        const src = createObjectUrl(file);

        const uploadedItem: UploadedImage = {
          id,
          src,
          backendId,
        };

        // Update the gallery immediately after each successful upload.
        setUploads((previous) => {
          if (previous.some((item) => item.id === id)) {
            releaseObjectUrl(src);
            return previous;
          }

          return [...previous, uploadedItem];
        });

        setOrder((previous) =>
          previous.includes(id) ? previous : [...previous, id]
        );

        // Browser caching is optional; the backend upload has succeeded.
        try {
          await dbPut({
            id,
            blob: file,
            createdAt: Date.now(),
            backendId,
          });
        } catch (error) {
          console.error("Could not cache uploaded drawing:", error);
        }

        // Remove completed files from the pending list so retries do not
        // upload already completed files a second time.
        setPendingFiles(pendingFiles.slice(index + 1));
      }

      setPendingFiles([]);
      setShowUploadConfirm(false);
    } catch (error) {
      console.error("Upload error:", error);

      alert(
        "An unexpected upload error occurred. Any remaining files are still selected."
      );
    } finally {
      setUploading(false);
    }
  }, [
    uploading,
    pendingFiles,
    createObjectUrl,
    releaseObjectUrl,
  ]);

  /* -------------------------------------------------------
     Reorder flow: edit -> Save -> confirm -> backend
     ------------------------------------------------------- */

  const requestSaveReorder = useCallback(() => {
    if (!isReordering || !draft || savingReorder) return;

    setShowReorderConfirm(true);
  }, [isReordering, draft, savingReorder]);

  const cancelSaveReorder = useCallback(() => {
    if (savingReorder) return;
    setShowReorderConfirm(false);
  }, [savingReorder]);

  const confirmSaveReorder = useCallback(async () => {
    if (!draft || savingReorder) return;

    setSavingReorder(true);

    const next = draft.filter((id) => itemsById.has(id));

    // The built-in images are local assets and do not have database IDs.
    // Only uploaded drawings are sent to the backend.
    const backendIds = next
      .map((id) => itemsById.get(id))
      .filter(
        (item): item is GalleryItem =>
          Boolean(item?.uploaded && item.backendId != null)
      )
      .map((item) => item.backendId as number);

    try {
      if (backendIds.length > 0) {
        const response = await fetch(`${API_BASE}/reorder`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(backendIds),
        });

        if (!response.ok) {
          const message = await response.text().catch(() => "");

          throw new Error(
            message || `Reorder failed: ${response.status}`
          );
        }
      }

      setOrder(next);
      setDraft(null);
      setIsReordering(false);
      setShowReorderConfirm(false);
      clearDrag();
    } catch (error) {
      console.error("Could not save drawing order:", error);

      alert(
        "Could not save the order to the backend. Your current reorder draft is preserved, so you can try saving again."
      );
    } finally {
      setSavingReorder(false);
    }
  }, [
    draft,
    savingReorder,
    itemsById,
    clearDrag,
  ]);

  /* -------------------------------------------------------
     Delete flow: request -> confirm -> delete
     ------------------------------------------------------- */

  const askDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    if (deleting) return;
    setPendingDeleteId(null);
  }, [deleting]);

  const deleteItem = useCallback(
    async (id: string) => {
      const item = itemsById.get(id);

      if (!item) return;

      setDeleting(true);

      try {
        if (item.uploaded) {
          if (item.backendId == null) {
            alert(
              "This uploaded image has no backend ID, so it cannot be deleted from the server."
            );
            return;
          }

          const response = await fetch(
            `${API_BASE}/${item.backendId}`,
            { method: "DELETE" }
          );

          if (!response.ok) {
            const message = await response.text().catch(() => "");

            throw new Error(
              message || `Delete failed: ${response.status}`
            );
          }

          try {
            await dbDelete(id);
          } catch (error) {
            console.error("Could not remove the local cached file:", error);
          }

          releaseObjectUrl(item.src);

          setUploads((previous) =>
            previous.filter((upload) => upload.id !== id)
          );
        } else {
          setHidden((previous) =>
            previous.includes(id) ? previous : [...previous, id]
          );
        }

        if (selectedImage === item.src) {
          setSelectedImage(null);
        }

        setOrder((previous) =>
          previous.filter((itemId) => itemId !== id)
        );

        setDraft((previous) =>
          previous
            ? previous.filter((itemId) => itemId !== id)
            : previous
        );

        setPendingDeleteId(null);
      } catch (error) {
        console.error("Could not delete drawing:", error);

        alert(
          "Could not delete this drawing. Check the backend connection and try again."
        );
      } finally {
        setDeleting(false);
      }
    },
    [itemsById, selectedImage, releaseObjectUrl]
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId || deleting) return;
    await deleteItem(pendingDeleteId);
  }, [pendingDeleteId, deleting, deleteItem]);

  const openImage = useCallback((src: string) => {
    if (isReordering) return;
    setSelectedImage(src);
  }, [isReordering]);

  /* -------------------------------------------------------
     Render
     ------------------------------------------------------- */

  return (
    <main className="drawings-page">
      <div className="drawings-background" aria-hidden="true" />
      <div className="drawings-grain" aria-hidden="true" />

      <BackButton onClick={handleBack} />

      <div className="drawings-actions">
        {isReordering ? (
          <>
            <button
              type="button"
              className="drawings-reorder-btn"
              onClick={cancelReorder}
              disabled={savingReorder}
            >
              Cancel
            </button>

            <button
              type="button"
              className="drawings-save-btn"
              onClick={requestSaveReorder}
              disabled={savingReorder}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="drawings-upload-btn"
              onClick={openFilePicker}
              disabled={uploading}
            >
              Upload
            </button>

            {view === "marquee" ? (
              <button
                type="button"
                className="drawings-reorder-btn"
                onClick={openViewAll}
              >
                View all
              </button>
            ) : (
              <button
                type="button"
                className="drawings-reset"
                onClick={() => void resetOrder()}
                disabled={savingReorder}
              >
                Reset
              </button>
            )}
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>

      <header className="drawings-header">
        <h1>
          DRAW<span>INGS</span>
        </h1>
      </header>

      {view === "all" ? (
        <>
          <div className="drawings-reorder-bar">
            <p>
              {isReordering
                ? "Drag images or use the arrows, then press Save."
                : "Browse your drawings or choose Reorder to arrange them."}
            </p>

            {isReordering ? (
              <button
                type="button"
                className="drawings-reset"
                onClick={() => {
                  const reset = [
                    ...defaultOrder.filter((id) => itemsById.has(id)),
                    ...uploads
                      .map((item) => item.id)
                      .filter((id) => itemsById.has(id)),
                  ];

                  setDraft(reset);
                  clearDrag();
                }}
              >
                Reset order
              </button>
            ) : (
              <div className="drawings-bar-actions">
                <button
                  type="button"
                  className="drawings-reset"
                  onClick={startReorder}
                >
                  Reorder
                </button>

                {hidden.length > 0 && (
                  <button
                    type="button"
                    className="drawings-reset"
                    onClick={restoreDeleted}
                  >
                    Restore deleted
                  </button>
                )}
              </div>
            )}
          </div>

          <section
            className={`drawings-gallery ${
              isReordering ? "is-reordering" : ""
            }`}
            aria-label="All drawings"
          >
            {gridItems.length === 0 && (
              <p className="drawings-empty">
                No images available. Upload some drawings or restore deleted ones.
              </p>
            )}

            {gridItems.map((item, index) => (
              <div
                className={`drawing-card ${
                  dragIndex === index ? "is-dragging" : ""
                } ${
                  overIndex === index && dragIndex !== index
                    ? "is-over"
                    : ""
                }`}
                key={item.id}
                draggable={isReordering}
                onDragStart={(event) => {
                  if (!isReordering) return;

                  setDragIndex(index);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(index));
                }}
                onDragOver={(event) => {
                  if (!isReordering) return;

                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";

                  if (overIndex !== index) {
                    setOverIndex(index);
                  }
                }}
                onDrop={(event) => {
                  if (!isReordering) return;

                  event.preventDefault();

                  const from = dragIndex;

                  if (from !== null) {
                    moveImage(from, index);
                  }

                  clearDrag();
                }}
                onDragEnd={clearDrag}
              >
                <button
                  type="button"
                  className="drawing-open"
                  onClick={() => openImage(item.src)}
                  aria-label={`View drawing ${index + 1}`}
                  tabIndex={isReordering ? -1 : 0}
                >
                  <img
                    src={item.src}
                    alt={`Tattoo drawing ${index + 1}`}
                    loading={index < 6 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />

                  <span className="drawing-card-overlay" />
                </button>

                <button
                  type="button"
                  className="drawing-remove"
                  aria-label="Delete image"
                  title="Delete"
                  onClick={() => askDelete(item.id)}
                >
                  <img src={deleteIcon} alt="" draggable={false} />
                </button>

                {isReordering && (
                  <span className="drawing-move">
                    <button
                      type="button"
                      aria-label="Move earlier"
                      disabled={index === 0}
                      onClick={() => moveImage(index, index - 1)}
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      aria-label="Move later"
                      disabled={index === gridItems.length - 1}
                      onClick={() => moveImage(index, index + 1)}
                    >
                      ›
                    </button>
                  </span>
                )}
              </div>
            ))}
          </section>
        </>
      ) : (
        <section
          className="drawings-marquee"
          aria-label="Drawing portfolio"
        >
          <MarqueeRow
            items={rowTop}
            label="Drawings row 1"
            onOpen={openImage}
          />

          <MarqueeRow
            items={rowBottom}
            reverse
            label="Drawings row 2"
            onOpen={openImage}
          />
        </section>
      )}

      {selectedImage && (
        <div
          className="drawing-lightbox"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="drawing-close"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedImage(null);
            }}
            aria-label="Close image"
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt="Selected tattoo drawing"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {pendingDeleteId && (
        <ConfirmModal
          title="Are you sure you want to delete?"
          message="This image will be removed from your gallery."
          confirmText="Submit"
          busy={deleting}
          onCancel={cancelDelete}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {showUploadConfirm && (
        <ConfirmModal
          title="Confirm upload"
          message={`Are you sure you want to upload ${pendingFiles.length} ${
            pendingFiles.length === 1 ? "image" : "images"
          }? The upload API will be called only after you confirm.`}
          confirmText="Upload"
          busy={uploading}
          onCancel={cancelUpload}
          onConfirm={() => void confirmUpload()}
        >
          <ul className="drawings-pending-files">
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`}>
                {file.name}
              </li>
            ))}
          </ul>
        </ConfirmModal>
      )}

      {showReorderConfirm && (
        <ConfirmModal
          title="Save new image order?"
          message="Are you sure you want to save this order? Confirming will save the gallery order and send the uploaded drawing IDs to the reorder API."
          confirmText="Confirm"
          busy={savingReorder}
          onCancel={cancelSaveReorder}
          onConfirm={() => void confirmSaveReorder()}
        />
      )}
    </main>
  );
}
