
import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import "./work.css";
import cubeBackground from "../../assets/close-up-colorful-cube-pattern-with-black-background-generative-ai_958192-97660.avif";

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
  image: string;
  category: string;
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

const tattoos: Tattoo[] = categories.flatMap((category) =>
  category.images.map((image) => ({
    image,
    category: category.title,
  }))
);

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

function Work({ onBackToHome }: WorkProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragDistance = useRef(0);
  const draggedRef = useRef(false);
  const selectedImageRef = useRef<Tattoo | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const filteredTattoos = activeCategory
    ? tattoos.filter((tattoo) => tattoo.category === activeCategory)
    : [];

 const backgroundImage =
  selectedImage ??
  filteredTattoos[activeIndex] ??
  filteredTattoos[0] ??
  {
    image: cubeBackground,
    category: "Background",
  };

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  // Preload all artwork for smoother background transitions.
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

  // Automatically rotate the selected category's carousel.
  useEffect(() => {
    if (
      !activeCategory ||
      isDragging ||
      selectedImage ||
      filteredTattoos.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filteredTattoos.length);
    }, 1800);

    return () => window.clearInterval(timer);
  }, [
    activeCategory,
    isDragging,
    selectedImage,
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
        // Pointer capture isn't available in every browser.
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
        <div className="wg-page-background-container" aria-hidden="true">
          <img
            key={backgroundImage.image}
            src={backgroundImage.image}
            alt=""
            className="wg-page-background"
            draggable={false}
          />
        </div>
      )}

      <div className="wg-page-background-shade" aria-hidden="true" />

     

      {/* FIRST SCREEN: FOUR CATEGORY CARDS */}
      {!activeCategory ? (
        <section className="wg-category-screen">
                 <BackButton
        onClick={activeCategory ? backToCategories : onBackToHome}
        label={activeCategory ? "Back to categories" : "Back to home"}
      />
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
                <span className="wg-category-number">
                  0{index + 1}
                </span>

                <img
                  src={category.images[0]}
                  alt={category.title}
                  className="wg-category-image"
                  draggable={false}
                />

                <span className="wg-category-overlay" />

                <span className="wg-category-content">
                  <strong>{category.title}</strong>
                  <span className="wg-category-subtitle">
                  </span>
                  
                  <span className="wg-category-explore">
                    EXPLORE WORK 
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : filteredTattoos.length > 0 ? (
        /* EXISTING 3D CAROUSEL */
        <div className="wg-gallery-area">
          
          <div
            className={`wg-carousel ${isDragging ? "is-dragging" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onDragStart={(event) => event.preventDefault()}
          >
             <BackButton
        onClick={activeCategory ? backToCategories : onBackToHome}
        label={activeCategory ? "Back to categories" : "Back to home"}
      />
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
                        if (draggedRef.current) return;

                        if (offset !== 0) {
                          setActiveIndex(index);
                          return;
                        }

                        openLightbox(tattoo);
                      }}
                      aria-label={`View ${tattoo.category} artwork ${index + 1}`}
                    >
                      <img
                        src={tattoo.image}
                        alt={`${tattoo.category} artwork ${index + 1}`}
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
            key={`foreground-${selectedImage.image}`}
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
    </section>
  );
}

export default Work;
