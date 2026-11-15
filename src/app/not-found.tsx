import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-20 pb-10 text-center sm:px-8 md:pt-32">
      <p className="label text-olive">404</p>
      <h1 className="mt-4 font-serif text-5xl tracking-[-0.02em] md:text-6xl">
        That one&rsquo;s <em className="text-terracotta italic">not on the menu.</em>
      </h1>
      <p className="mx-auto mt-6 max-w-md text-lg text-ink-soft">
        The page you were looking for doesn&rsquo;t exist, or it moved.
      </p>
      <div className="mt-10 flex justify-center gap-8 font-medium">
        <Link href="/recipes/" className="link-underline">Browse recipes</Link>
        <Link href="/" className="link-underline">Go home</Link>
      </div>
    </div>
  );
}
