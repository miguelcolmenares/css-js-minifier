import { Circle, icons } from "lucide-react";
import type { LucideProps } from "lucide-react";

const toPascal = (name: string) =>
  name.replace(/(^|-)([a-z0-9])/g, (_, __, char: string) => char.toUpperCase());

/** Render a lucide icon by its kebab-case name. An unknown name shows a plain circle. */
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Component = icons[toPascal(name) as keyof typeof icons] ?? Circle;
  return <Component aria-hidden="true" {...props} />;
}
