import type { ComponentProps, ReactNode } from "react";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

type MDXComponents = NonNullable<MDXRemoteProps["components"]>;

/**
 * Ingredient line with a checkbox for ticking things off while cooking.
 * Plain HTML (no client JS): the checked style uses the `peer` selector and
 * the surrounding <form> can clear every box with a native reset button.
 */
function IngredientItem({ children }: { children?: ReactNode }) {
  return (
    <li className="border-b border-linen last:border-b-0">
      <label className="group flex cursor-pointer items-start gap-3.5 py-3 leading-snug">
        <input
          type="checkbox"
          className="ingredient-check peer no-print mt-[0.2rem] size-[1.05rem] shrink-0 cursor-pointer appearance-none border border-ink-soft/60 bg-paper transition-colors group-hover:border-ink"
        />
        <span className="transition-colors peer-checked:text-ink-soft/70 peer-checked:line-through peer-checked:decoration-linen">
          {children}
        </span>
      </label>
    </li>
  );
}

export const ingredientComponents: MDXComponents = {
  ul: (props: ComponentProps<"ul">) => <ul {...props} className="ingredient-list" />,
  li: IngredientItem,
};

export const instructionComponents: MDXComponents = {
  ol: (props: ComponentProps<"ol">) => <ol {...props} className="step-list" />,
};
