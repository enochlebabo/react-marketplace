import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENCIES } from "../utils/constants";

interface CurrencyComboboxProps {
  value: string;
  onValueChange: (code: string) => void;
  disabled?: boolean;
  triggerClassName?: string;
  // Compact trigger renders just the 3-letter code (for inline use next to
  // a price input). Default renders the full label.
  compact?: boolean;
  // Align the dropdown to the right edge of the trigger. Useful when the
  // trigger is narrow (e.g. compact mode) and its left edge is near the
  // left of a form — aligning right keeps the dropdown inside the form.
  align?: "start" | "end";
}

export function CurrencyCombobox({
  value,
  onValueChange,
  disabled,
  triggerClassName,
  compact = false,
  align = "start",
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q),
    );
  }, [search]);

  // Reset highlight whenever the filtered set changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset highlight on search change
  useEffect(() => {
    setHighlighted(0);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus search on open and clear prior query
  useEffect(() => {
    if (open) {
      setSearch("");
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Keep highlighted item in view during keyboard nav
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-index="${highlighted}"]`,
    );
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  const selected = CURRENCIES.find((c) => c.code === value);
  const triggerLabel = compact
    ? (selected?.code ?? value)
    : (selected?.label ?? value);

  const handleSelect = (code: string) => {
    onValueChange(code);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlighted];
      if (item) handleSelect(item.code);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          "justify-between font-normal",
          !selected && "text-muted-foreground",
          triggerClassName,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div
          className={cn(
            // z-[1100] matches the pattern used by LocationPicker's own
            // search popover, staying above Leaflet's map panes (≤ 700)
            // and map controls (z-[1000]).
            "absolute top-full z-[1100] mt-1 w-[280px] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            align === "end" ? "right-0" : "left-0",
          )}
          // Prevent clicks inside the dropdown from dismissing it (if the
          // dialog wrapper has click-to-close behavior).
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search currency..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto overscroll-contain p-1"
          >
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No currency found.
              </p>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.code}
                  type="button"
                  aria-selected={value === c.code}
                  data-index={i}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                    i === highlighted && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => handleSelect(c.code)}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === c.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{c.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
