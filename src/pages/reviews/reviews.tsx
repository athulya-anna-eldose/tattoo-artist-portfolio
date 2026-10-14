import { useEffect, useRef } from "react";
import "./reviews.css";

import review1 from "../../assets/IMG_20260627_094245.jpg";
import review2 from "../../assets/IMG_20260627_094407.jpg";
import review3 from "../../assets/IMG_20260627_094553.jpg";
import review4 from "../../assets/IMG_20260627_094645.jpg";
import review5 from "../../assets/IMG_20260627_094656.jpg";
import review6 from "../../assets/IMG_20260627_094707.jpg";
import review7 from "../../assets/IMG_20260627_094844.jpg";
import review8 from "../../assets/IMG_20260627_094900.jpg";
import review9 from "../../assets/IMG_20260627_094917.jpg";
import review10 from "../../assets/IMG_20260627_094941.jpg";
import review11 from "../../assets/IMG_20260627_095029.jpg";

const reviewImages = [
  review1,
  review2,
  review3,
  review4,
  review5,
  review6,
  review7,
  review8,
  review9,
  review10,
  review11,
];

interface BackButtonProps {
  onClick: () => void;
}

interface ReviewsProps {
  onBackToHome: () => void;
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

function Reviews({ onBackToHome }: ReviewsProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    let animationFrame = 0;

    const updateActiveCard = () => {
      const cards = carousel.querySelectorAll<HTMLElement>(".review-card");
      const screenCenter = window.innerWidth / 2;

      let closestCard: HTMLElement | null = null;
      let closestDistance = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.left + rect.width / 2;
        const distance = Math.abs(screenCenter - cardCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestCard = card;
        }
      });

      cards.forEach((card) => {
        card.classList.toggle("is-active", card === closestCard);
      });

      animationFrame = requestAnimationFrame(updateActiveCard);
    };

    animationFrame = requestAnimationFrame(updateActiveCard);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className="reviews-page">
      <BackButton onClick={onBackToHome} />

      <header className="reviews-header">
        <span className="reviews-label">KIND WORDS</span>

        <h1>
          Real Stories<span>.</span>
        </h1>

        <p>
          Every tattoo has a story.
          <br />
          Here's what people have to say about their experience.
        </p>
      </header>

      <div className="reviews-carousel" ref={carouselRef}>
        <div className="reviews-track">
          {[0, 1].map((group) => (
            <div
              className="reviews-set"
              key={group}
              aria-hidden={group === 1}
            >
              {reviewImages.map((image, index) => (
                <article className="review-card" key={index}>
                  <div className="review-image-wrap">
                    <img
                      src={image}
                      alt={
                        group === 0
                          ? `Customer review ${index + 1}`
                          : ""
                      }
                      loading={index < 4 ? "eager" : "lazy"}
                    />

                    <div className="review-glow" />
                  </div>

                  <span className="review-number">
                    REVIEW / {String(index + 1).padStart(2, "0")}
                  </span>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="reviews-footer">
        <span>THANK YOU FOR TRUSTING THE ART</span>
        <span>EVERY PIECE MATTERS.</span>
      </div>
    </section>
  );
}

export default Reviews;