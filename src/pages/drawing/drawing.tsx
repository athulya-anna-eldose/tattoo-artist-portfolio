import { useState } from "react";
import "./drawing.css";

import drawing1 from "../../assets/1.jpg";
import drawing2 from "../../assets/2.jpg";
import drawing3 from "../../assets/3.jpg";
import drawing4 from "../../assets/4.jpg";
import drawing5 from "../../assets/5.jpg";
import drawing6 from "../../assets/6.jpg";

interface DrawingsPageProps {
  onBackToHome: () => void;
}

const drawings = [
  { image: drawing1 },
  { image: drawing2 },
  { image: drawing3 },
  { image: drawing4 },
  { image: drawing5 },
  { image: drawing6 },
];

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

const BackButton = ({
  onClick,
  className = "drawings-back", // FIX: was "cp__back", so drawings-back styles never applied
}: BackButtonProps) => (
  <button
    type="button"
    className={className}
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

export default function DrawingsPage({ onBackToHome }: DrawingsPageProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <main className="drawings-page">
      <header className="drawings-nav">
        <BackButton onClick={onBackToHome} />

        <a
          className="drawings-book"
          href="https://wa.me/918137837584"
          target="_blank"
          rel="noopener noreferrer"
        >
          Book Appointment ↗
        </a>
      </header>

      <section className="drawings-gallery" aria-label="Drawing gallery">
        {drawings.map((drawing, index) => (
          <button
            type="button"
            key={drawing.image}
            className="drawing-card"
            onClick={() => setSelectedImage(drawing.image)}
          >
            <div className="drawing-image">
              <img
                src={drawing.image}
                alt={`Drawing ${index + 1}`}
                loading="lazy"
              />
              <span className="drawing-zoom">↗</span>
            </div>

            <div className="drawing-caption">
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
          </button>
        ))}
      </section>

      <footer className="drawings-footer">
        <p>Have an idea in mind?</p>
        <a
          href="https://wa.me/918137837584"
          target="_blank"
          rel="noopener noreferrer"
        >
          Let&apos;s bring it to life ↗
        </a>
      </footer>

      {selectedImage && (
        <div
          className="drawing-lightbox"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="drawing-close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            ×
          </button>

          <img
            src={selectedImage}
            alt="Selected drawing"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}