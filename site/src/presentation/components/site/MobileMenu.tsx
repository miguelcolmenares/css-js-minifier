import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

/** The navigation as a sheet, shown only below the `md` breakpoint. It traps focus and returns it on close. */
export function MobileMenu({
  links,
  action,
}: {
  links: readonly { label: string; href: string }[];
  action?: { label: string; href: string };
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex size-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg-bright md:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <SheetClose asChild key={link.href}>
              <a
                href={link.href}
                className="rounded-md px-3 py-2.5 text-fg-muted hover:bg-surface-2 hover:text-fg-bright"
              >
                {link.label}
              </a>
            </SheetClose>
          ))}
          {action && (
            <a
              href={action.href}
              className="mt-3 rounded-md bg-primary px-3 py-2.5 text-center font-medium text-primary-foreground"
            >
              {action.label}
            </a>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
