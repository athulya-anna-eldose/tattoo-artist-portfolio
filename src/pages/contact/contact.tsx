import "./contact.css";

import tattoo1 from "../../assets/1.jpg";
import tattoo2 from "../../assets/1h.jpeg";
import tattoo3 from "../../assets/1g.jpeg";
import tattoo4 from "../../assets/2h.png";
import tattoo5 from "../../assets/5g.jpg";
import tattoo6 from "../../assets/10h.jpg";
import tattoo7 from "../../assets/11h.jpeg";

import whatsappLogo from "../../assets/whatsapp_monochrome.png";
import instagramLogo from "../../assets/instagram_monochrome.png";
import emailLogo from "../../assets/email_monochrome.png";

/* ------------------------------------------------------------------
   Types
------------------------------------------------------------------- */
interface NavItem {
  label: string;
  href: string;
}

interface ContactItem {
  label: string;
  href: string;
  logo: string;
}

interface BackButtonProps {
  onClick: () => void;
}

interface ContactPageProps {
  onBackToHome: () => void;
}

/* ------------------------------------------------------------------
   Config (edit these)
------------------------------------------------------------------- */
const BRAND = "ROWAN BLACK"; // your name / studio name

const LINKS = {
 email: "https://mail.google.com/mail/?view=cm&fs=1&to=akhi21ds@gmail.com",
  whatsapp: "https://wa.me/918137837584", // country code + number, no + or spaces
  instagram: "https://instagram.com/akhi_21_?srtk=MWFzM3R2YmhsY3cyZQ%3D%3D",
} as const;


const CONTACTS: ContactItem[] = [
  { label: "Email", href: LINKS.email, logo: emailLogo },
  { label: "WhatsApp", href: LINKS.whatsapp, logo: whatsappLogo },
  { label: "Instagram", href: LINKS.instagram, logo: instagramLogo },
];

// Left to right. Index 3 is the small centre card.
const GALLERY: string[] = [
  tattoo1,
  tattoo2,
  tattoo3,
  tattoo4,
  tattoo5,
  tattoo6,
  tattoo7,
];

/* ------------------------------------------------------------------
   Sub-components
------------------------------------------------------------------- */
const BackButton = ({ onClick }: BackButtonProps) => (
  <button
    type="button"
    className="cp__back"
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

const Navbar = () => (
  <header className="cp__navwrap">
    <nav className="cp__nav" aria-label="Main">

      <a
        href={LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="cp__pill"
      >
        Book Appointment
      </a>
    </nav>
  </header>
);

const Hero = () => (
  <div className="cp__hero">
    <h1>
      The Kind of Tattoo
      <br />
      You Won&rsquo;t Regret.
    </h1>
    <p>
      Exclusive blackwork tattoos by appointment-only.
      <br />
      Where clean design meets permanent art.
    </p>
  </div>
);

const ImageStrip = () => (
  <div className="cp__stage">
    <span className="cp__smoke cp__smoke--l" aria-hidden="true" />
    <span className="cp__smoke cp__smoke--r" aria-hidden="true" />

    <div className="cp__strip">
      {GALLERY.map((src, index) => (
        <figure key={src} className={`cp__card cp__card--${index}`}>
          <img src={src} alt={`Tattoo work ${index + 1}`} loading="lazy" />
        </figure>
      ))}
    </div>
  </div>
);

const ContactIcons = () => (
  <ul className="cp__icons">
    {CONTACTS.map(({ label, href, logo }) => (
      <li key={label}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="cp__icon"
          aria-label={label}
          title={label}
        >
          <img src={logo} alt="" />
        </a>
      </li>
    ))}
  </ul>
);

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */
export default function ContactPage({ onBackToHome }: ContactPageProps) {
  return (
    <main className="cp">
      <div className="cp__frame">
        <BackButton onClick={onBackToHome} />
        <Navbar />
        <Hero />
        <ImageStrip />
        <ContactIcons />
      </div>
    </main>
  );
}