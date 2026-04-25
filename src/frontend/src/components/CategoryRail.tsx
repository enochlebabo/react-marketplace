import { cn } from "@/lib/utils";
import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { Category } from "../backend";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "../utils/constants";

const CATEGORY_ORDER: Array<{
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "all", label: "All", Icon: LayoutGrid },
  {
    value: "electronics",
    label: CATEGORY_LABELS[Category.electronics],
    Icon: CATEGORY_ICONS[Category.electronics],
  },
  {
    value: "fashion",
    label: CATEGORY_LABELS[Category.fashion],
    Icon: CATEGORY_ICONS[Category.fashion],
  },
  {
    value: "home",
    label: CATEGORY_LABELS[Category.home],
    Icon: CATEGORY_ICONS[Category.home],
  },
  {
    value: "furniture",
    label: CATEGORY_LABELS[Category.furniture],
    Icon: CATEGORY_ICONS[Category.furniture],
  },
  {
    value: "vehicles",
    label: CATEGORY_LABELS[Category.vehicles],
    Icon: CATEGORY_ICONS[Category.vehicles],
  },
  {
    value: "sports",
    label: CATEGORY_LABELS[Category.sports],
    Icon: CATEGORY_ICONS[Category.sports],
  },
  {
    value: "books",
    label: CATEGORY_LABELS[Category.books],
    Icon: CATEGORY_ICONS[Category.books],
  },
  {
    value: "toys",
    label: CATEGORY_LABELS[Category.toys],
    Icon: CATEGORY_ICONS[Category.toys],
  },
  {
    value: "other",
    label: CATEGORY_LABELS[Category.other],
    Icon: CATEGORY_ICONS[Category.other],
  },
];

export function CategoryRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onBrowse = pathname === "/" || pathname === "/browse";
  const search = useSearch({ strict: false }) as { category?: string };

  if (!onBrowse) return null;

  const activeCategory = search.category ?? "all";

  return (
    <div className="sticky top-16 z-30 border-b bg-card">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6">
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-none">
          {CATEGORY_ORDER.map(({ value, label, Icon }) => {
            const active = activeCategory === value;
            return (
              <Link
                key={value}
                to="/browse"
                search={(prev: Record<string, string>) => {
                  const { category: _, ...rest } = prev;
                  if (value === "all") return rest;
                  return { ...rest, category: value };
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
