import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

import Home from "./pages/home/home";
import Contact from "./pages/contact/contact";
import Work from "./pages/work/work";
import Reviews from "./pages/reviews/reviews";
import Piercing from "./pages/piercing/piercing";
import Drawings from "./pages/drawing/drawing";
import About from "./pages/about/about";
import LogoIntro from "./pages/logoIntro/LogoIntro";
import logoImage from "./assets/a_clean_isolated_logo_graphic_on_a_transparent_ba.png";

type Page =
  | "home"
  | "work"
  | "reviews"
  | "contact"
  | "piercing"
  | "drawings"
  | "about";

const PAGES: Page[] = [
  "home",
  "work",
  "reviews",
  "contact",
  "piercing",
  "drawings",
  "about",
];

// The page is stored in the URL hash (#/piercing), so no Vercel
// rewrite rules are needed.
const readPage = (): Page => {
  const name = window.location.hash.replace(/^#\/?/, "");
  return (PAGES as string[]).includes(name) ? (name as Page) : "home";
};

const readIdx = (): number => {
  const idx = window.history.state?.idx;
  return typeof idx === "number" ? idx : 0;
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(readPage);
  const [showIntro, setShowIntro] = useState(true);

  // How many in-site navigations happened (0 = first page of the visit).
  const idxRef = useRef(readIdx());

  // Mark the first history entry.
  useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, page: readPage(), idx: idxRef.current },
      ""
    );
  }, []);

  // Browser Back / Forward buttons.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      idxRef.current =
        typeof event.state?.idx === "number" ? event.state.idx : 0;
      setCurrentPage(readPage());
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: Page) => {
    if (next === readPage()) return;

    idxRef.current += 1;

    window.history.pushState(
      { page: next, idx: idxRef.current },
      "",
      next === "home" ? "#/" : `#/${next}`
    );

    setCurrentPage(next);
  }, []);

  // On-site back arrows: behave like the browser Back button when
  // there is a previous page, otherwise go home.
  const goBack = useCallback(() => {
    if (idxRef.current > 0) {
      window.history.back();
    } else {
      navigate("home");
    }
  }, [navigate]);

  const goToHome = () => navigate("home");

  const completeIntro = useCallback(() => {
    try {
      sessionStorage.setItem("akhil-logo-intro-seen", "true");
    } catch {
      // Continue normally if session storage is unavailable.
    }

    setShowIntro(false);
  }, []);

  // Start every page at the top (the About page is long).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className={`app ${currentPage === "home" ? "app--home" : ""}`}>
      {showIntro && <LogoIntro onComplete={completeIntro} />}

      <nav className="navbar">
        <div
          className="logo"
          onClick={goToHome}
          role="button"
          tabIndex={0}
          aria-label="Go to home"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              goToHome();
            }
          }}
        >
          <img
            src={logoImage}
            alt="Akhil Das Inker logo"
            className="logo-img"
          />
        </div>

        <div className="nav-links">
          <button onClick={() => navigate("about")}>About</button>
          <button onClick={() => navigate("reviews")}>Reviews</button>
          <button onClick={() => navigate("contact")}>Contact</button>
        </div>
      </nav>

      <main>
        {currentPage === "home" && (
          <Home
            onWorkClick={() => navigate("work")}
            onPiercingClick={() => navigate("piercing")}
            onDrawingsClick={() => navigate("drawings")}
            onReviewsClick={() => navigate("reviews")}
            onContactClick={() => navigate("contact")}
            onAboutClick={() => navigate("about")}
          />
        )}

        {currentPage === "work" && <Work onBackToHome={goBack} />}
        {currentPage === "piercing" && <Piercing onBackToHome={goBack} />}
        {currentPage === "drawings" && <Drawings onBackToHome={goBack} />}
        {currentPage === "reviews" && <Reviews onBackToHome={goBack} />}
        {currentPage === "contact" && <Contact onBackToHome={goBack} />}

        {currentPage === "about" && (
          <About
            onBackToHome={goBack}
            onReviewsClick={() => navigate("reviews")}
            onContactClick={() => navigate("contact")}
          />
        )}
      </main>
    </div>
  );
}

export default App;