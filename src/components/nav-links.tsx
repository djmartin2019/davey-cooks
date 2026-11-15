"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/recipes/", label: "Recipes" },
  { href: "/about/", label: "About" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-6 sm:gap-8">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href) || pathname === href.slice(0, -1);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "relative py-2 text-[0.95rem] font-medium transition-colors",
                "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-terracotta after:transition-transform",
                active
                  ? "text-ink after:scale-x-100"
                  : "text-ink-soft after:scale-x-0 hover:text-ink hover:after:scale-x-100",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
