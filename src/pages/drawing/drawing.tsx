
import { useState } from "react";
import "./drawing.css";

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
interface BackButtonProps {
  onClick: () => void;
}
const BackButton = ({ onClick }: BackButtonProps) => (
  <button
    type="button"
    className="reviews-back"
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
interface DrawingsProps {
  onBackToHome: () => void;
}

export default function Drawings({ onBackToHome }: DrawingsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <main className="drawings-page">
      {/* Ambient background */}
      <div className="drawings-background" aria-hidden="true" />
      <div className="drawings-grain" aria-hidden="true" />

      <header className="drawings-header">
        
      <BackButton onClick={onBackToHome} />


        <h1>
          DRAW<span>INGS</span>
        </h1>

        <div className="drawings-divider">
          <span />
          <i />
          <span />
        </div>
      </header>

      {/* The images enter in a scattered 3D formation,
          then assemble into a four-column gallery. */}
      <section
        className="drawings-gallery"
        aria-label="Drawing portfolio"
      >
        {drawings.map((image, index) => (
          <button
            className="drawing-card"
            key={image}
            style={{ "--index": index } as React.CSSProperties}
            onClick={() => setSelectedImage(image)}
            aria-label={`View drawing ${index + 1}`}
          >
            <span className="drawing-number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <img
              src={image}
              alt={`Original drawing ${index + 1}`}
              loading={index < 4 ? "eager" : "lazy"}
              draggable={false}
            />

            <span className="drawing-card-overlay" />
            <span className="drawing-expand">↗</span>
          </button>
        ))}
      </section>

      <footer className="drawings-footer">
        <span>ARTISTRY IN EVERY DETAIL</span>
        <span>12 ORIGINAL WORKS</span>
      </footer>

      {/* Full image preview */}
      {selectedImage && (
        <div
          className="drawing-lightbox"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <button
            className="drawing-close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt="Selected original drawing"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}
