
import { useEffect, useState } from "react";
import "./LogoIntro.css";

import logoImage from "../../assets/a_clean_isolated_logo_graphic_on_a_transparent_ba.png";

interface LogoIntroProps {
  onComplete: () => void;
}

function LogoIntro({ onComplete }: LogoIntroProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
  const exitTimer = window.setTimeout(() => {
    setExiting(true);
  }, 3500);

  const completeTimer = window.setTimeout(() => {
    onComplete();
  }, 4300);

  return () => {
    window.clearTimeout(exitTimer);
    window.clearTimeout(completeTimer);
  };
}, [onComplete]);

  const skipIntro = () => {
    setExiting(true);

    window.setTimeout(() => {
      onComplete();
    }, 650);
  };

  return (
    <section
      className={`logo-intro ${exiting ? "logo-intro--exit" : ""}`}
      aria-label="Akhil Das tattoo artist intro"
    >
      <div className="intro-grain" />
      <div className="intro-vignette" />

      <div className="intro-orb intro-orb--one" />
      <div className="intro-orb intro-orb--two" />

      <div className="intro-stage">
        <div className="intro-halo" />

     <div className="intro-logo-frame">
  <img
    className="intro-logo"
    src={logoImage}
    alt="Tattoo studio emblem"
  />

  <div
    className="intro-logo-light"
    style={{ ["--logo-mask" as string]: `url(${logoImage})` }}
  />
</div>

        <div className="intro-floor-light" />
      </div>

   

      {/* <div className="intro-loader">
        <span />
      </div> */}


    </section>
  );
}

export default LogoIntro;
