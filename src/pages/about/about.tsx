import { memo } from "react";
import "./about.css";

/* ---------------------------------------------------------
   IMPORTANT: point this to the photo you want on top of the
   About page (for example the same photo used on the Home page).
   Change the file name to match a file in your assets folder.
   --------------------------------------------------------- */
import artistPhoto from "../../assets/B8732C23-1655-4905-A262-A2EFDE2212D6.png";

interface AboutProps {
  onBackToHome: () => void;
  onReviewsClick: () => void;
  onContactClick: () => void;
}

/* Edit this text to tell your own story. */
const ABOUT_PARAGRAPHS: string[] = [
  "Hello, I'm Akhil, a tattoo artist and creative designer. I work across piercing, tattoo and drawings, and I bring the same attention to detail and clean, minimal linework to each of them.",
  "Every piece begins with a conversation. I listen to your idea, shape it into a design that suits you, and look after every step, from the first sketch to the final result.",
  "My goal is simple: you leave feeling comfortable, and with work you are proud to wear.",
];

// const SPECIALITIES = ["Piercing", "Tattoo", "Drawings"];

function About({ onBackToHome, onReviewsClick, onContactClick }: AboutProps) {
  return (
    <section className="about">
      <div className="about-photo">
         <img
    src={artistPhoto}
    alt="Akhil Das, tattoo artist and creative designer"
    draggable={false}
    decoding="async"
  />

        <div className="about-photo-shade" aria-hidden="true" />

        <button
          type="button"
          className="about-back"
          onClick={onBackToHome}
          aria-label="Back to home"
          title="Back to home"
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
      </div>

      <div className="about-body">
        <p className="about-eyebrow">ABOUT ME</p>

        <h1>
          Hi, I&apos;m <span className="about-gradient">Akhil.</span>
        </h1>

        <p className="about-role">Tattoo Artist &amp; Creative Designer.</p>

        {ABOUT_PARAGRAPHS.map((paragraph) => (
          <p className="about-text" key={paragraph}>
            {paragraph}
          </p>
        ))}
{/* 
        <ul className="about-tags" aria-label="Specialities">
          {SPECIALITIES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul> */}

        <div className="about-actions">
          {/* <button
            type="button"
            className="about-button about-button--solid"
            onClick={onContactClick}
          >
            Get in touch
          </button>

          <button
            type="button"
            className="about-button"
            onClick={onReviewsClick}
          >
            Read client reviews
          </button> */}

          <button
            type="button"
            className="about-button"
            onClick={onBackToHome}
          >
            Back to home
          </button>
        </div>
      </div>
    </section>
  );
}

export default memo(About);