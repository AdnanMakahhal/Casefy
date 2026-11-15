import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-[#CFDDD5] bg-[#ffffff] px-4 py-6 text-xs text-[#102018] sm:flex-row sm:px-8">
      <p>
        <strong className="font-bold">&copy;</strong> 2026 Casefy. All rights reserved.
      </p>
      <nav aria-label="Legal" className="flex items-center gap-6">
        <Link
          to="/policy"
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Policy
        </Link>
        <Link
          to="/privacy"
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Privacy
        </Link>
        <Link
          to="/terms"
          className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#294137]"
        >
          Terms
        </Link>
      </nav>
    </footer>
  );
}

export default Footer;
