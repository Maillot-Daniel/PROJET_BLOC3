
import { Link } from "react-router-dom";
import "./Footer.css";

const FooterComponent = () => {
  return (
    <footer className="footer">
      {/* Liens principaux */}
      <div className="footer-links">
        <Link to="/about">À propos</Link>
        <Link to="/privacy">Confidentialité</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/cgu">CGU</Link>
      </div>

      {/* Réseaux sociaux */}
      <div className="social-links">
        <a
          href="https://github.com"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="icon"
          >
            <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.15 3.34 9.52 7.97 11.06.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.24.7-3.92-1.56-3.92-1.56-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.41-1.27.74-1.56-2.59-.3-5.31-1.3-5.31-5.78 0-1.28.46-2.33 1.2-3.15-.12-.3-.52-1.52.11-3.17 0 0 .98-.31 3.22 1.2a11.14 11.14 0 012.94-.4c1 .01 2 .13 2.93.4 2.24-1.51 3.22-1.2 3.22-1.2.64 1.65.24 2.87.12 3.17.75.82 1.2 1.87 1.2 3.15 0 4.49-2.73 5.48-5.33 5.77.42.36.79 1.07.79 2.16 0 1.56-.01 2.82-.01 3.21 0 .31.21.68.8.56A11.52 11.52 0 0023.5 12c0-6.29-5.23-11.5-11.5-11.5z" />
          </svg>
          GitHub
        </a>

        <a
          href="https://linkedin.com"
          aria-label="LinkedIn"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="icon"
          >
            <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.08 1 2.5 1 4.98 2.12 4.98 3.5zM.25 8.5h4.5v13.5h-4.5v-13.5zM8.75 8.5h4.28v1.82h.06c.6-1.14 2.07-2.34 4.26-2.34 4.56 0 5.4 3 5.4 6.89v7.13h-4.5v-6.32c0-1.5-.03-3.43-2.09-3.43-2.1 0-2.42 1.63-2.42 3.32v6.43h-4.5v-13.5z" />
          </svg>
          LinkedIn
        </a>

        <a
          href="https://twitter.com"
          aria-label="Twitter"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 24 24"
            className="icon"
          >
            <path d="M23.954 4.569a10 10 0 01-2.825.775 4.932 4.932 0 002.163-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 00-8.38 4.482C7.69 8.094 4.066 6.13 1.64 3.161a4.822 4.822 0 00-.666 2.475c0 1.708.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.917 4.917 0 003.946 4.827 4.996 4.996 0 01-2.224.085 4.93 4.93 0 004.6 3.417 9.867 9.867 0 01-6.102 2.105c-.396 0-.79-.023-1.17-.067a13.94 13.94 0 007.557 2.212c9.054 0 14.002-7.496 14.002-13.986 0-.21 0-.423-.015-.634A9.936 9.936 0 0024 4.59z" />
          </svg>
          Twitter
        </a>
      </div>

      {/* Bas de page */}
      <p className="copyright">
        © Jeux Olympiques France 2024, tous droits réservés
      </p>
    </footer>
  );
};

export default FooterComponent;
