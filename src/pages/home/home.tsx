import "./home.css";

import artistPhoto from "../../assets/B8732C23-1655-4905-A262-A2EFDE2212D6.png";

import piercingPhoto from "../../assets/1g.jpeg";
import tattooPhoto from "../../assets/1h.jpeg";
import drawingPhoto from "../../assets/11h.jpeg";

interface HomeProps {
  onWorkClick: () => void;
  onPiercingClick: () => void;
  onDrawingsClick: () => void;
  onReviewsClick: () => void;
  onContactClick: () => void;
}

const categories = [
  {
    title: "Piercing",
    image: piercingPhoto,
  },
  {
    title: "Tattoo",
    image: tattooPhoto,
  },
  {
    title: "Drawings",
    image: drawingPhoto,
  },
];

function Home({
  onWorkClick,
  onPiercingClick,
  onDrawingsClick,
  onReviewsClick,
}: HomeProps) {
  const handleCategoryClick = (title: string) => {
    if (title === "Piercing") {
      onPiercingClick();
    } else if (title === "Tattoo") {
      onWorkClick();
    } else if (title === "Drawings") {
      onDrawingsClick();
    }
  };

  return (
    <section
      className="home"
      style={{
        backgroundImage: `url("${artistPhoto}")`,
      }}
    >
      <div className="home-overlay" />

      {/* LEFT SIDE: NUMBERED CATEGORY LIST */}
      <div className="home-gallery">
        <p className="gallery-heading">
          <span />
          EXPLORE MY WORK
          <span />
        </p>

        <div className="gallery-list">
          {categories.map((category, index) => (
            <button
              type="button"
              key={category.title}
              className="gallery-item"
              onClick={() => handleCategoryClick(category.title)}
              aria-label={`Explore ${category.title}`}
            >
              <span className="gallery-number">
                0{index + 1}
              </span>

              <img
                src={category.image}
                alt={`${category.title} by Akhil Das`}
              />

              <span className="gallery-item-info">
                <span className="gallery-item-title">
                  {category.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: ARTIST INTRODUCTION */}
      <div className="hero-content">
        <p className="hero-subtitle">
          TATTOO ARTIST &amp; CREATIVE DESIGNER
        </p>

        <h1>
          Art That Lives
          <br />
          On Your Skin.
        </h1>

        <div className="hero-intro">
          <p className="hero-description">
            Every face tells a story. Every detail holds meaning.
            <span className="gold-text">
              {" "}Let&apos;s turn yours into art.
            </span>
          </p>

          <p className="hero-bio">
            I&apos;m Akhil Das, specialising in{" "}
            <strong>black &amp; grey realism</strong>, lifelike
            portraits, mini portraits, custom designs, and intricate
            dotwork. Through delicate shading, striking contrasts,
            and meticulous detail, I create tattoos that capture
            your vision and preserve the stories that matter to you.
          </p>

          <p className="booking-message">
            Your idea. My artistry.{" "}
            <strong>Your story, etched in ink.</strong>
          </p>
        </div>

        <button
          type="button"
          className="reviews-link"
          onClick={onReviewsClick}
        >
          Read Client Reviews <span>→</span>
        </button>
      </div>
    </section>
  );
}

export default Home;