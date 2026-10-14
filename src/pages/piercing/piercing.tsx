import "./piercing.css";

import piercing1 from "../../assets/1.jpg";
import piercing2 from "../../assets/2.jpg";
import piercing3 from "../../assets/3.jpg";
import piercing4 from "../../assets/4.jpg";
import piercing5 from "../../assets/5.jpg";
import piercing6 from "../../assets/6.jpg";

interface PiercingPageProps {
  onBackToHome: () => void;
}

const piercings = [
  { image: piercing1 },
  { image: piercing2 },
  { image: piercing3 },
  { image: piercing4 },
  { image: piercing5 },
  { image: piercing6 },
];

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

const BackButton = ({
  onClick,
  className = "piercing-back", // FIX: was "cp__back", so piercing-back styles never applied
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

export default function PiercingPage({ onBackToHome }: PiercingPageProps) {
  return (
    <main className="piercing-page">
      <header className="piercing-nav">
        <BackButton onClick={onBackToHome} />

        <a
          className="piercing-book"
          href="https://wa.me/918137837584"
          target="_blank"
          rel="noopener noreferrer"
        >
          Book Appointment ↗
        </a>
      </header>

      <section className="piercing-gallery" aria-label="Piercing gallery">
        {piercings.map((piercing, index) => (
          <article className="piercing-card" key={piercing.image}>
            <div className="piercing-image">
              <img
                src={piercing.image}
                alt={`Piercing ${index + 1}`}
                loading="lazy"
              />
              <span className="piercing-number">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          </article>
        ))}
      </section>

      <footer className="piercing-footer">
        <p>Your style. Your choice.</p>
        <a
          href="https://wa.me/918137837584"
          target="_blank"
          rel="noopener noreferrer"
        >
          Start a conversation ↗
        </a>
      </footer>
    </main>
  );
}