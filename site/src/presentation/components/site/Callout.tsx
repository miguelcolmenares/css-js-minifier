import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/infrastructure/cn";

const kinds = {
  note: { icon: Info, label: "Note", tone: "text-brand" },
  tip: { icon: Lightbulb, label: "Tip", tone: "text-success" },
  warning: { icon: TriangleAlert, label: "Warning", tone: "text-warn" },
} as const;

/** A highlighted note, tip or warning inside a page. */
export function Callout({
  kind = "note",
  title,
  children,
  className,
}: {
  kind?: keyof typeof kinds;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: IconComponent, label, tone } = kinds[kind];
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-lg border border-border bg-bg-subtle px-4 py-3.5",
        className,
      )}
    >
      <IconComponent className={cn("mt-0.5 size-4 shrink-0", tone)} aria-hidden="true" />
      <div className="min-w-0 text-sm leading-relaxed text-fg">
        <span className={cn("mr-2 font-mono text-[11px] tracking-[0.14em] uppercase", tone)}>
          {title ?? label}
        </span>
        {children}
      </div>
    </aside>
  );
}
