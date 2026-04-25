import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchSpotlightProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HeaderSearchParams {
  q?: string;
}

export function SearchSpotlight({ open, onOpenChange }: SearchSpotlightProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onBrowse = pathname === "/" || pathname === "/browse";
  const search = useSearch({ strict: false }) as HeaderSearchParams;
  const [query, setQuery] = useState(onBrowse ? (search.q ?? "") : "");

  // When the spotlight opens, seed the input from the current URL.
  useEffect(() => {
    if (open) {
      setQuery(onBrowse ? (search.q ?? "") : "");
    }
  }, [open, onBrowse, search.q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate({
      to: "/browse",
      search: (prev: Record<string, string>) => {
        const { q: _, ...rest } = prev;
        if (trimmed) return { ...rest, q: trimmed };
        return rest;
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl sm:rounded-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex items-center gap-3 px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands and sellers"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden h-6 shrink-0 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            ESC
          </kbd>
        </form>
      </DialogContent>
    </Dialog>
  );
}
