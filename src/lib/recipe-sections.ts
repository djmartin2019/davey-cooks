/**
 * Splits a recipe's MDX body into its `##` sections.
 *
 * docs/CONTENT_GUIDE.md defines the body as a sequence of `##` sections
 * (Overview, Ingredients, Instructions, Kitchen Notes, Next Time, Food Safety,
 * References). Splitting on those headings lets each section get its own
 * layout. Any section the page doesn't specifically recognize is still
 * rendered — nothing is dropped.
 */

export type SectionKind =
  | "intro" // content before the first ## heading
  | "overview"
  | "ingredients"
  | "instructions"
  | "kitchen-notes"
  | "next-time"
  | "food-safety"
  | "references"
  | "other";

export type RecipeSection = {
  kind: SectionKind;
  /** Heading text exactly as written in the MDX. */
  heading: string;
  /** Unique id for in-page anchors. */
  id: string;
  /** MDX content of the section, without the heading line. */
  content: string;
};

const KIND_BY_HEADING: Record<string, SectionKind> = {
  overview: "overview",
  ingredients: "ingredients",
  instructions: "instructions",
  method: "instructions",
  "kitchen notes": "kitchen-notes",
  "next time": "next-time",
  "food safety": "food-safety",
  references: "references",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function splitSections(body: string): RecipeSection[] {
  const sections: RecipeSection[] = [];
  const usedIds = new Set<string>();
  let current: { heading: string; lines: string[] } = { heading: "", lines: [] };
  let inFence = false;

  const push = () => {
    const content = current.lines.join("\n").trim();
    if (!current.heading && !content) return;
    const kind = current.heading
      ? (KIND_BY_HEADING[current.heading.toLowerCase()] ?? "other")
      : "intro";
    let id = current.heading ? slugify(current.heading) || "section" : "intro";
    while (usedIds.has(id)) id += "-x";
    usedIds.add(id);
    sections.push({ kind, heading: current.heading, id, content });
  };

  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const match = !inFence && /^##\s+(.+?)\s*#*\s*$/.exec(line);
    if (match) {
      push();
      current = { heading: match[1], lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  push();

  return sections;
}

/** Strips Markdown emphasis/links for plain-text uses such as JSON-LD. */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([<{])/g, "$1")
    .trim();
}

/** Top-level list items of a section (`- item` or `1. item`), as plain text. */
export function listItems(content: string, ordered: boolean): string[] {
  const pattern = ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*+]\s+(.+)$/;
  return content
    .split(/\r?\n/)
    .map((line) => pattern.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => toPlainText(m[1]));
}
