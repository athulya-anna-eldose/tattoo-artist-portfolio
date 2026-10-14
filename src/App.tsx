import { useState } from "react";
import "./App.css";

import Home from "./pages/home/home";
import Contact from "./pages/contact/contact";
import Work from "./pages/work/work";
import Reviews from "./pages/reviews/reviews";
import Piercing from "./pages/piercing/piercing";
import Drawings from "./pages/drawing/drawing";

type Page =
  | "home"
  | "work"
  | "reviews"
  | "contact"
  | "piercing"
  | "drawings";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const goToHome = () => setCurrentPage("home");

  return (
    <div className="app">
      <nav className="navbar">
        <div
          className="logo"
          onClick={goToHome}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              goToHome();
            }
          }}
        >
          AKHIL DAS
        </div>

        <div className="nav-links">
          <button onClick={() => setCurrentPage("work")}>
            Work
          </button>

          <button onClick={() => setCurrentPage("reviews")}>
            Reviews
          </button>

          <button onClick={() => setCurrentPage("contact")}>
            Contact
          </button>
        </div>
      </nav>

      <main>
        {currentPage === "home" && (
          <Home
            onWorkClick={() => setCurrentPage("work")}
            onPiercingClick={() => setCurrentPage("piercing")}
            onDrawingsClick={() => setCurrentPage("drawings")}
            onReviewsClick={() => setCurrentPage("reviews")}
            onContactClick={() => setCurrentPage("contact")}
          />
        )}

        {currentPage === "work" && (
          <Work onBackToHome={goToHome} />
        )}

        {currentPage === "piercing" && (
          <Piercing onBackToHome={goToHome} />
        )}

        {currentPage === "drawings" && (
          <Drawings onBackToHome={goToHome} />
        )}

        {currentPage === "reviews" && (
          <Reviews onBackToHome={goToHome} />
        )}

        {currentPage === "contact" && (
          <Contact onBackToHome={goToHome} />
        )}
      </main>
    </div>
  );
}

export default App;