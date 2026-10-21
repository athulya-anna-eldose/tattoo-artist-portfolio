
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import "./piercing.css";

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
  image: string;
}

const tattoos: Tattoo[] = [
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
].map((image) => ({
  image,
  category: "Minimal Line Works",
}));

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

function Piercing({ onBackToHome }: PiercingProps) {
  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragDistance = useRef(0);
  const draggedRef = useRef(false);
  const selectedImageRef = useRef<Tattoo | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const filteredTattoos = tattoos;

  /*
   * The background follows the active carousel photo.
   * When the lightbox opens, it follows the selected photo.
   */
  const backgroundImage =
    selectedImage ??
    filteredTattoos[activeIndex] ??
    filteredTattoos[0];

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  // Preload the gallery photos to help avoid a blank flash when
  // the background changes to another image.
  useEffect(() => {
    tattoos.forEach((tattoo) => {
      const image = new Image();
      image.src = tattoo.image;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Automatically rotate the carousel while the lightbox is closed.
  useEffect(() => {
    if (isDragging || selectedImage || filteredTattoos.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) => (current + 1) % filteredTattoos.length
      );
    }, 1800);

    return () => window.clearInterval(timer);
  }, [isDragging, selectedImage, filteredTattoos.length]);

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
      (tattoo) => tattoo.image === current.image
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

  // Keyboard controls and scroll locking for the lightbox.
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
    setActiveIndex(
      (current) =>
        (current + direction + filteredTattoos.length) %
        filteredTattoos.length
    );
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
        // Pointer capture may not be available in every browser.
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
      {/* Full-photo background, separate from the carousel cards. */}
      {backgroundImage && (
        <div className="wg-page-background-container" aria-hidden="true">
          <img
            src={backgroundImage.image}
            alt=""
            className="wg-page-background"
            draggable={false}
          />
        </div>
      )}

      <div className="wg-page-background-shade" aria-hidden="true" />

      <BackButton onClick={onBackToHome} />

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

                return (
                  <article
                    className={`wg-slide ${
                      offset === 0 ? "is-active" : ""
                    }`}
                    data-position={offset}
                    key={tattoo.image}
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

      {/* Lightbox with its own blurred full-screen background. */}
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
            key={`foreground-${selectedImage.image}`}
            src={selectedImage.image}
            className="wg-lightbox-img"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
          />

          <div className="wg-lightbox-caption">
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
    </section>
  );
}

export default Piercing;
