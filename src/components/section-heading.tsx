import Link from "next/link";

type Props = {
  id: string;
  eyebrow: string;
  title: string;
  action?: { href: string; label: string };
};

export function SectionHeading({ id, eyebrow, title, action }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-ink pt-6">
      <div>
        <p className="label text-olive">{eyebrow}</p>
        <h2 id={id} className="mt-3 font-serif text-4xl leading-tight tracking-[-0.015em] md:text-5xl">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="link-underline mb-1 text-[0.95rem] font-medium">
          {action.label} <span aria-hidden="true">&rarr;</span>
        </Link>
      )}
    </div>
  );
}
