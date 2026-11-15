import Link from "next/link";
import { NavLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-linen">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8 md:py-6">
        <Link href="/" aria-label="Davey Cooks — home" className="rounded-sm">
          <Wordmark />
        </Link>
        <nav aria-label="Main">
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
