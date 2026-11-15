import Link from "next/link";
import { site } from "@/lib/format";
import { Wordmark } from "./wordmark";

/** Rendered at build time (static export). */
function BuildYear() {
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-linen md:mt-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr] md:py-16">
        <div className="max-w-sm">
          <Link href="/" aria-label="Davey Cooks — home" className="inline-block rounded-sm">
            <Wordmark />
          </Link>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            A home cooking journal. Recipes I&rsquo;ve made, notes on how they turned out, and
            what I&rsquo;ll try next time.
          </p>
        </div>
        <div className="flex flex-col justify-between gap-8 md:items-end">
          <nav aria-label="Footer">
            <ul className="flex gap-8 text-[0.95rem] font-medium">
              <li>
                <Link href="/" className="link-underline">Home</Link>
              </li>
              <li>
                <Link href="/recipes/" className="link-underline">Recipes</Link>
              </li>
              <li>
                <Link href="/about/" className="link-underline">About</Link>
              </li>
            </ul>
          </nav>
          <p className="text-sm text-ink-soft">
            &copy; <BuildYear /> {site.name}. <span className="italic font-serif text-base">{site.tagline}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
