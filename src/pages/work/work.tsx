
import { useEffect, useState } from "react";
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
import tattoo27 from "../../assets/9h.jpg"
import tattoo28 from "../../assets/10h.jpg";
import tattoo29 from "../../assets/11h.jpeg"
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
  { image: tattoo1, category: "Minimal Line Works" },
  { image: tattoo2,  category: "Minimal Line Works" },
  { image: tattoo3, category: "Minimal Line Works" },
  { image: tattoo4, category: "Minimal Line Works" },
  { image: tattoo5, category: "Minimal Line Works" },
  { image: tattoo6, category: "Minimal Line Works" },
  { image: tattoo7, category: "Minimal Line Works" },
  { image: tattoo8, category: "Minimal Line Works" },
  { image: tattoo9, category: "Minimal Line Works" },
  { image: tattoo10, category: "Black & Grey" },
  { image: tattoo11,  category: "Black & Grey" },
  { image: tattoo12, category: "Black & Grey" },
  { image: tattoo13, category: "Black & Grey" },
  { image: tattoo14, category: "Black & Grey" },
  { image: tattoo15, category: "Black & Grey" },
  { image: tattoo16, category: "Black & Grey" },
  { image: tattoo17, category: "Black & Grey" },
  { image: tattoo18, category: "Black & Grey" },
  { image: tattoo19, category: "Healed Works" },
  { image: tattoo20, category: "Healed Works" },
  { image: tattoo21,  category: "Healed Works" },
  { image: tattoo22, category: "Healed Works" },
  { image: tattoo23, category: "Healed Works" },
  { image: tattoo24, category: "Healed Works" },
  { image: tattoo25, category: "Healed Works" },
  { image: tattoo26, category: "Healed Works" },
  { image: tattoo27, category: "Healed Works" },
  { image: tattoo28, category: "Healed Works" },
  { image: tattoo29, category: "Healed Works" },
  { image: tattoo30, category: "Portraits & Mini Potraits" },
  { image: tattoo31,  category: "Portraits & Mini Potraits" },
  { image: tattoo32, category: "Portraits & Mini Potraits" },
  { image: tattoo33, category: "Portraits & Mini Potraits" },
  { image: tattoo34, category: "Portraits & Mini Potraits" },
  { image: tattoo35, category: "Portraits & Mini Potraits" },
  { image: tattoo36, category: "Portraits & Mini Potraits" },
];
interface BackButtonProps {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
  title?: string;
}

const categories = [
  "All",
  "Black & Grey",
  "Minimal Line Works",
  "Portraits & Mini Potraits",
  "Healed Works",
];

const BackButton = ({
  onClick,
  type = "button",
  className = "reviews-back",
  "aria-label": ariaLabel = "Go back",
  disabled = false,
  title = "Back",
}: BackButtonProps) => (
  <button
    type={type}
    className={className}
    onClick={onClick}
    aria-label={ariaLabel}
    disabled={disabled}
    title={title}
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
      {className.includes("wg-arrow-right") ? (
  <path d="M9 5l7 7-7 7" />
) : (
  <path d="M15 5l-7 7 7 7" />
)}
    </svg>
  </button>
);
function Work({ onBackToHome }: WorkProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<Tattoo | null>(null);

  const filteredTattoos = tattoos.filter(
    (tattoo) =>
      activeCategory === "All" ||
      tattoo.category === activeCategory
  );

  const total = filteredTattoos.length;

  const activeTattoo = filteredTattoos[activeIndex];

  useEffect(() => {
    if (total === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= total) {
      setActiveIndex(0);
    }
  }, [activeIndex, total]);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }

      if (event.key === "ArrowRight") {
        setSelectedImage((current) => {
          if (!current || total === 0) return current;

          const index = filteredTattoos.findIndex(
            (tattoo) => tattoo.image === current.image
          );

          return filteredTattoos[(index + 1) % total];
        });
      }

      if (event.key === "ArrowLeft") {
        setSelectedImage((current) => {
          if (!current || total === 0) return current;

          const index = filteredTattoos.findIndex(
            (tattoo) => tattoo.image === current.image
          );

          return filteredTattoos[
            (index - 1 + total) % total
          ];
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage, filteredTattoos, total]);

  const changeCategory = (category: string) => {
    setActiveCategory(category);
    setActiveIndex(0);
  };

  const moveCarousel = (direction: number) => {
    if (total < 2) return;

    setActiveIndex((current) => (current + direction + total) % total);
  };

  const getCardStyle = (index: number) => {
    const offset = index - activeIndex;

    const angle = 19;
    const distance = 165;
    const depth = 115;

    return {
      "--offset": offset,
      "--angle": `${offset * angle}deg`,
      "--distance": `${offset * distance}px`,
      "--depth": `${Math.abs(offset) * -depth}px`,
      zIndex: 20 - Math.abs(offset),
      opacity: Math.abs(offset) > 4 ? 0 : 1,
      pointerEvents: Math.abs(offset) > 4 ? "none" as const : "auto" as const,
    } as React.CSSProperties;
  };

  return (
    <section className="wg-page">

     <BackButton className="wg-back" onClick={onBackToHome} />
      

      <nav className="wg-categories" aria-label="Tattoo categories">
        {categories.map((category) => (
          <button
            type="button"
            key={category}
            className={
              activeCategory === category ? "active" : ""
            }
            onClick={() => changeCategory(category)}
          >
            {category}
          </button>
        ))}
      </nav>

      <div className="wg-stage">
        {total > 0 ? (
          <div className="wg-carousel">
            {filteredTattoos.map((tattoo, index) => {
              const offset = index - activeIndex;
              const distance = Math.abs(offset);
              const isActive = offset === 0;

              return (
                <article
                  key={tattoo.image}
                  className={`wg-slide ${isActive ? "is-active" : ""}`}
                  style={getCardStyle(index)}
                  aria-hidden={distance > 4}
                >
                  <button
                    type="button"
                    className="wg-artwork"
                    onClick={() => {
                      if (!isActive) {
                        setActiveIndex(index);
                      } else {
                        setSelectedImage(tattoo);
                      }
                    }}
                    tabIndex={distance > 4 ? -1 : 0}
                   
                  >
                    <img
                      src={tattoo.image}
                     
                      loading={distance < 2 ? "eager" : "lazy"}
                      draggable={false}
                    />

                    <span className="wg-image-shade" />

                    <span className="wg-artwork-info">
                      <span>
                       
                        <small>{tattoo.category.toUpperCase()}</small>
                      </span>

                      <small>
                        {String(index + 1).padStart(2, "0")} /{" "}
                        {String(total).padStart(2, "0")}
                      </small>
                    </span>

                    {isActive && (
                      <span className="wg-view-hint">
                        CLICK TO EXPLORE ↗
                      </span>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="wg-empty">
            <span>COMING SOON</span>
            <p>New artwork for this collection is on its way.</p>
          </div>
        )}

        <BackButton
          type="button"
          className="wg-arrow wg-arrow-left"
          onClick={() => moveCarousel(-1)}
          aria-label="Previous tattoo"
          disabled={total < 2}
        />
          

        <BackButton
          type="button"
          className="wg-arrow wg-arrow-right"
          onClick={() => moveCarousel(1)}
          aria-label="Next tattoo"
          disabled={total < 2}
        />
    
      </div>

      {/* <div className="wg-bottom">
        <div className="wg-progress">
          <div className="wg-progress-number">
            <span>{String(total ? activeIndex + 1 : 0).padStart(2, "0")}</span>
            <i />
            <small>{String(total).padStart(2, "0")}</small>
          </div>

          <div className="wg-progress-track">
            <span
              style={{
                height: `${total ? ((activeIndex + 1) / total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div> */}

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
            
            className="wg-lightbox-img"
            onClick={(event) => event.stopPropagation()}
          />

          <div className="wg-lightbox-caption">
            
            <small>{selectedImage.category}</small>
          </div>
        </div>
      )}
    </section>
  );
}

export default Work;
