import Image from "next/image";
import type { Recipe } from "@/lib/recipes";

/**
 * Process shots from the cook (dough, shaping, boiling…), shown in the order
 * listed in frontmatter. Hidden in print to keep the printed recipe compact.
 */
export function ProcessPhotos({ photos }: { photos: Recipe["gallery"] }) {
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="process-photos" className="no-print mx-auto mt-20 max-w-5xl px-5 sm:px-8 md:mt-28">
      <div className="border-t border-ink pt-6">
        <p className="label text-olive">Along the way</p>
        <h2 id="process-photos" className="mt-3 font-serif text-4xl leading-tight tracking-[-0.015em] md:text-5xl">
          In the kitchen
        </h2>
      </div>

      <div className={`mt-10 grid gap-x-8 gap-y-10 ${photos.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {photos.map((photo) => (
          <figure key={photo.src}>
            <div className="relative aspect-[4/3] overflow-hidden bg-linen-soft">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes={photos.length > 1 ? "(min-width: 1024px) 30rem, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 64rem, 100vw"}
                className="object-cover"
              />
            </div>
            {photo.caption && (
              <figcaption className="mt-3 text-sm leading-relaxed text-ink-soft">{photo.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
