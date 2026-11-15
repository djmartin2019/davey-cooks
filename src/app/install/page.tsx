import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Ellipsis, EllipsisVertical, Share, SquarePlus } from "lucide-react";
import { site } from "@/lib/format";

const description =
  "Add Davey Cooks to your phone's home screen so the recipes open full-screen, like an app. No app store needed.";

export const metadata: Metadata = {
  title: "Install the app",
  description,
  alternates: { canonical: "/install/" },
  openGraph: { title: `Install the app · ${site.name}`, description, url: "/install/", images: [site.ogImage] },
};

/** An inline icon matching what's on the phone's screen. */
function Glyph({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="mx-0.5 inline-flex translate-y-[0.15em] items-center text-ink" role="img" aria-label={label}>
      {children}
    </span>
  );
}

const iconProps = { className: "size-[1.1em]", strokeWidth: 1.75, "aria-hidden": true } as const;

function Steps({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="mt-6 divide-y divide-linen border-y border-linen">
      {steps.map((step, i) => (
        <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5">
          <span className="font-serif text-3xl leading-none text-terracotta italic">{i + 1}</span>
          <p className="leading-relaxed text-ink-soft">{step}</p>
        </li>
      ))}
    </ol>
  );
}

function Platform({ id, eyebrow, title, steps, note }: {
  id: string;
  eyebrow: string;
  title: string;
  steps: ReactNode[];
  note: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-ink pt-6">
      <p className="label text-olive">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-serif text-3xl tracking-[-0.015em] md:text-4xl">
        {title}
      </h2>
      <Steps steps={steps} />
      <p className="mt-5 text-sm leading-relaxed text-ink-soft">{note}</p>
    </section>
  );
}

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8 md:pt-20">
      <div className="max-w-3xl">
        <p className="label text-olive">Install</p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.02] tracking-[-0.025em] text-balance md:text-7xl">
          Keep it <em className="text-terracotta italic">on the counter.</em>
        </h1>
        <div className="mt-10 flex items-start gap-5">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={72}
            height={72}
            className="size-16 shrink-0 rounded-[22%] shadow-[0_1px_2px_rgb(41_42_37/0.15)] md:size-[4.5rem]"
          />
          <p className="max-w-xl font-serif text-[1.35rem] leading-[1.5]">
            Add Davey Cooks to your phone&rsquo;s home screen and it opens full-screen, like an app: no
            browser bars, no app store, nothing to update.
          </p>
        </div>

        <p className="mt-8 hidden border-l-2 border-olive bg-olive-soft px-5 py-4 text-[0.95rem] leading-relaxed standalone:block">
          You&rsquo;re already using the app. Nothing more to do here.
        </p>
      </div>

      <div className="mt-16 grid gap-16 md:mt-20 md:grid-cols-2 md:gap-12">
        <Platform
          id="iphone"
          eyebrow="iPhone & iPad"
          title="In Safari"
          steps={[
            <>Open this site in Safari.</>,
            <>
              Tap the Share button{" "}
              <Glyph label="Share"><Share {...iconProps} /></Glyph>. On newer versions of iOS it&rsquo;s
              behind the <Glyph label="More"><Ellipsis {...iconProps} /></Glyph> button next to the address bar.
            </>,
            <>
              Scroll down and tap <strong className="font-medium text-ink">Add to Home Screen</strong>{" "}
              <Glyph label=""><SquarePlus {...iconProps} /></Glyph>.
            </>,
            <>
              If you see <strong className="font-medium text-ink">Open as Web App</strong>, leave it on. Then
              tap <strong className="font-medium text-ink">Add</strong>.
            </>,
          ]}
          note={<>Chrome and other browsers on iPhone have the same option in their Share menu.</>}
        />
        <Platform
          id="android"
          eyebrow="Android"
          title="In Chrome"
          steps={[
            <>Open this site in Chrome.</>,
            <>
              Tap the menu button <Glyph label="Menu"><EllipsisVertical {...iconProps} /></Glyph> in the
              top corner.
            </>,
            <>
              Tap <strong className="font-medium text-ink">Add to home screen</strong> or{" "}
              <strong className="font-medium text-ink">Install app</strong>.
            </>,
            <>
              Tap <strong className="font-medium text-ink">Install</strong> to confirm.
            </>,
          ]}
          note={<>Other Android browsers usually offer the same option in their main menu.</>}
        />
      </div>

      <div className="mt-16 max-w-3xl border-t border-ink pt-8 md:mt-20">
        <p className="leading-relaxed text-ink-soft">
          The app is the same site, so it always has the latest recipes. It needs an internet connection.
          To remove it, press and hold the icon and choose to remove or delete it.
        </p>
        <Link
          href="/recipes/"
          className="mt-10 inline-flex items-center gap-2 bg-ink px-6 py-3.5 text-[0.95rem] font-medium text-ivory transition-colors hover:bg-olive"
        >
          Browse the recipes <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
