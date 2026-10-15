
import { useEffect, useRef, useState } from "react";
import "./work.css";

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

const tattoos: Tattoo[] = [
  ...[
    tattoo1, tattoo2, tattoo3, tattoo4, tattoo5,
    tattoo6, tattoo7, tattoo8, tattoo9,
  ].map((image) => ({ image, category: "Minimal Line Works" })),

  ...[
    tattoo10, tattoo11, tattoo12, tattoo13, tattoo14,
    tattoo15, tattoo16, tattoo17, tattoo18,
  ].map((image) => ({ image, category: "Black & Grey" })),

  ...[
    tattoo19, tattoo20, tattoo21, tattoo22, tattoo23,
    tattoo24, tattoo25, tattoo26, tattoo27, tattoo28, tattoo29,
  ].map((image) => ({ image, category: "Healed Works" })),

  ...[
    tattoo30, tattoo31, tattoo32, tattoo33,
    tattoo34, tattoo35, tattoo36,
  ].map((image) => ({
    image,
    category: "Portraits & Mini Potraits",
  })),
];

const categories = [
  "Black & Grey",
  "Portraits & Mini Potraits",
  "Minimal Line Works",
  "Healed Works",
];

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


function Work({ onBackToHome }: WorkProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartX = useRef(0);
  const dragDistance = useRef(0);
  const draggedRef = useRef(false);
  const selectedImageRef = useRef<Tattoo | null>(null);

  const filteredTattoos = tattoos.filter(
    (tattoo) =>
      activeCategory === "All" ||
      tattoo.category === activeCategory
  );

  useEffect(() => {
    selectedImageRef.current = selectedImage;
  }, [selectedImage]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  // Automatically advance the centre card.
  useEffect(() => {
    if (isDragging || selectedImage || filteredTattoos.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % filteredTattoos.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [activeCategory, filteredTattoos.length, isDragging, selectedImage]);

  useEffect(() => {
    if (!selectedImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
        return;
      }

      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      const current = selectedImageRef.current;
      if (!current || !filteredTattoos.length) return;

      const index = filteredTattoos.findIndex(
        (tattoo) => tattoo.image === current.image
      );

      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next =
        (index + direction + filteredTattoos.length) %
        filteredTattoos.length;

      setSelectedImage(filteredTattoos[next]);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedImage, filteredTattoos]);

  const moveGallery = (direction: number) => {
    if (!filteredTattoos.length) return;

    setActiveIndex(
      (current) =>
        (current + direction + filteredTattoos.length) %
        filteredTattoos.length
    );
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragStartX.current = event.clientX;
    dragDistance.current = 0;
    draggedRef.current = false;
    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    const distance = event.clientX - dragStartX.current;

    if (Math.abs(distance) > 8) {
      draggedRef.current = true;
    }

    dragDistance.current = distance;
  };

  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const distance = dragDistance.current;

    if (Math.abs(distance) > 35) {
      // Drag left = next card; drag right = previous card.
      moveGallery(distance < 0 ? 1 : -1);
    }

    window.setTimeout(() => {
      draggedRef.current = false;
    }, 100);
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    dragDistance.current = 0;
  };

  // Calculate each card's position relative to the centre card.
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
      

<div className="wg-category-bar">
  <BackButton onClick={onBackToHome} />

  <nav className="wg-categories" aria-label="Tattoo categories">
    {categories.map((category) => (
      <button
        type="button"
        key={category}
        className={activeCategory === category ? "active" : ""}
        onClick={() => setActiveCategory(category)}
      >
        {category}
      </button>
    ))}
  </nav>
</div>


      {filteredTattoos.length > 0 ? (
        <div className="wg-gallery-area">
          {/* <BackButton
            className="wg-arrow wg-arrow-left"
            onClick={() => moveGallery(-1)}
            label="Previous tattoos"
          /> */}

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
                    key={`${activeCategory}-${tattoo.image}`}
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
                        setSelectedImage(tattoo);
                      }}
                      aria-label={`View ${tattoo.category} tattoo ${index + 1}`}
                    >
                      <img
                        src={tattoo.image}
                        alt={`${tattoo.category} tattoo ${index + 1}`}
                        draggable={false}
                      />

                      <span className="wg-image-shade" />

                      <span className="wg-artwork-info">
                        <small>{tattoo.category.toUpperCase()}</small>
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

          {/* <BackButton
            className="wg-arrow wg-arrow-right"
            onClick={() => moveGallery(1)}
            label="Next tattoos"
          /> */}
        </div>
      ) : (
        <div className="wg-empty">
          <span>COMING SOON</span>
          <p>New artwork for this collection is on its way.</p>
        </div>
      )}


      {selectedImage && (
        <div
          className="wg-lightbox"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="wg-lightbox-close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            ×
          </button>

          <img
            src={selectedImage.image}
            alt={selectedImage.category}
            className="wg-lightbox-img"
            onClick={(event) => event.stopPropagation()}
          />

          <div className="wg-lightbox-caption">
            <small>{selectedImage.category}</small>
          </div>

          <div className="wg-lightbox-navigation">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                moveGallery(-1);
                const index = filteredTattoos.findIndex(
                  (item) => item.image === selectedImage.image
                );
                setSelectedImage(
                  filteredTattoos[
                    (index - 1 + filteredTattoos.length) %
                      filteredTattoos.length
                  ]
                );
              }}
              aria-label="Previous image"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                moveGallery(1);
                const index = filteredTattoos.findIndex(
                  (item) => item.image === selectedImage.image
                );
                setSelectedImage(
                  filteredTattoos[(index + 1) % filteredTattoos.length]
                );
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

