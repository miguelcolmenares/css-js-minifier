import { Icon } from "./Icon";

/** One feature: a lucide icon name, an eyebrow, a title and a sentence. */
export interface FeatureItem {
  icon: string;
  eyebrow: string;
  title: string;
  text: string;
}

/** Features as cards, two columns from the `md` breakpoint. */
export function FeatureGrid({ features }: { features: readonly FeatureItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {features.map((feature) => (
        <article
          key={`${feature.eyebrow}-${feature.title}`}
          className="rounded-lg border border-border bg-surface p-6"
        >
          <div className="mb-5 flex size-9 items-center justify-center rounded-md border border-border-strong bg-surface-2 text-brand">
            <Icon name={feature.icon} className="size-4.5" />
          </div>
          <p className="mb-2 font-mono text-[11px] tracking-[0.14em] text-brand uppercase">
            {feature.eyebrow}
          </p>
          <h3 className="text-lg font-semibold tracking-tight text-fg-bright">{feature.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">{feature.text}</p>
        </article>
      ))}
    </div>
  );
}
