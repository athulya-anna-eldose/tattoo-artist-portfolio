
import "./home.css";

import artistPhoto from "../../assets/B8732C23-1655-4905-A262-A2EFDE2212D6.png";

interface HomeProps {
  onWorkClick: () => void;
  onPiercingClick: () => void;
  onDrawingsClick: () => void;
  onReviewsClick: () => void;
  onContactClick: () => void;
}

const categories = ["Piercing", "Tattoo", "Drawings"];

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
      style={{ backgroundImage: `url("${artistPhoto}")` }}
    >
      <div className="home-overlay" />

      <div className="hero-content">

        <h1>
          Hello, <span className="gradient-text">I'm Akhil.</span>
          <br />
          <span className="hero-role">
            Tattoo Artist &amp; Creative Designer.
          </span>
        </h1>

        <p className="hero-bio">
          Every face tells a story. I specialise in{" "}
          <strong>black &amp; grey realism</strong>, lifelike portraits, mini
          portraits, custom designs and intricate dotwork. Your idea. My
          artistry. <strong>Your story, etched in ink.</strong>
        </p>

        <div className="hero-buttons">
          {categories.map((title) => (
            <button
              key={title}
              type="button"
              className="secondary-button"
              onClick={() => handleCategoryClick(title)}
            >
              {title}
              <span className="button-arrow"/>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="reviews-link"
          onClick={onReviewsClick}
        >
          Read Client Reviews <span>→</span>
        </button>
      </div>

      <div className="hero-signature">
        <span>AKHIL DAS</span>
        <span>TATTOO ARTIST</span>
      </div>
    </section>
  );
}

export default Home;
