import clsx from "clsx";
import Image from "next/image";

type Props = {
  src: string | null;
  alt: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Recipe photograph with a consistent crop, or a quiet typographic
 * placeholder when no photo exists yet. The parent sets the aspect ratio.
 */
export function RecipePhoto({ src, alt, title, sizes, priority, className }: Props) {
  if (!src) {
    return (
      <div
        className={clsx(
          "relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden bg-linen-soft p-6 text-center",
          className,
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="size-10 text-linen"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="24" cy="24" r="17" />
          <circle cx="24" cy="24" r="11" />
        </svg>
        <span className="label text-ink-soft/80">No photo yet</span>
        <span className="sr-only">{title}</span>
      </div>
    );
  }

  return (
    <div className={clsx("relative h-full w-full overflow-hidden bg-linen-soft", className)}>
      <Image
        src={src}
        alt={alt ?? ""}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
