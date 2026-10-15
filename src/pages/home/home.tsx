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
  { title: "Piercing", image: piercingPhoto },
  { title: "Tattoo", image: tattooPhoto },
  { title: "Drawings", image: drawingPhoto },
];

function Home({
  onWorkClick,
  onPiercingClick,
  onDrawingsClick,
  onReviewsClick,
  onContactClick,
}: HomeProps) {
  const handleCategoryClick = (title: string) => {
    if (title === "Piercing") onPiercingClick();
    else if (title === "Tattoo") onWorkClick();
    else if (title === "Drawings") onDrawingsClick();
  };

  return (
    <section className="home">
      {/* LEFT: TEXT */}
      <div className="hero-content">
        <h1>
          Hello, <span className="gradient-text">I&apos;m Akhil.</span>
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
        
          {categories.map((item) => (
            <button
              type="button"
            className="secondary-button"
              onClick={() => handleCategoryClick(item.title)}
            >
              <span>{item.title}</span>
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

      {/* RIGHT: PHOTO WITH CATEGORY TABS ON TOP */}
      <div className="hero-photo">
        <img src={artistPhoto} alt="Akhil Das, tattoo artist" />

        
      </div>
    </section>
  );
}

export default Home;