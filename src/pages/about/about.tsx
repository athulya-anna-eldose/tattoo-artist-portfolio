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
/* Edit this text to tell your own story. Text between *stars* becomes bold. */
const ABOUT_PARAGRAPHS: string[] = [
  "I'm a *Professional Tattoo artist, Piercer & Creative Designer* with over 5 years of experience, transforming personal stories, ideas and inspirations into meaningful works of art.",
  "Specialising in *Black & Grey Realism, Fine Line, Dotworks etc*, my approach combines artistic precision, attention to detail and individuality to create thoughtfully crafted tattoos.",
  "I believe *every great tattoo experience begins with trust*. From consultation to completion, I prioritise *client comfort, clear communication, strict hygiene standards and professional care*, ensuring every client feels *respected, confident and comfortable*.",
  "My philosophy is simple: *Never compromise on Art, Quality or Trust*.",
];

/* Turns *text* into bold text. */
const renderBold = (text: string) =>
  text
    .split(/\*(.+?)\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));

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

       <h1>
  Hi, I&apos;m <span className="about-gradient">Akhil Das.</span>
</h1>

        <p className="about-role">Tattoo Artist, Piercer  &amp; Creative Designer.</p>

        {ABOUT_PARAGRAPHS.map((paragraph) => (
  <p className="about-text" key={paragraph}>
    {renderBold(paragraph)}
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