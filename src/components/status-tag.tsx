import clsx from "clsx";
import { statusLabel, statusShortLabel } from "@/lib/format";
import type { RecipeStatus } from "@/lib/recipes";

const tone: Record<RecipeStatus, string> = {
  cooked: "text-olive",
  "cooked-needs-refinement": "text-terracotta-deep",
  planned: "text-ink-soft",
};

const dot: Record<RecipeStatus, string> = {
  cooked: "bg-olive",
  "cooked-needs-refinement": "bg-terracotta",
  planned: "border border-ink-soft bg-transparent",
};

export function StatusTag({
  status,
  long = false,
  className,
}: {
  status: RecipeStatus;
  long?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx("label inline-flex items-center gap-1.5", tone[status], className)}>
      <span aria-hidden="true" className={clsx("inline-block size-1.5 rounded-full", dot[status])} />
      {long ? statusLabel[status] : statusShortLabel[status]}
    </span>
  );
}
