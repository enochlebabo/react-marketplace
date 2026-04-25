import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Link,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { MessageCircle, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import { SearchSpotlight } from "./SearchSpotlight";

interface MarketplaceHeaderProps {
  onSellClick: () => void;
}

export function MarketplaceHeader({ onSellClick }: MarketplaceHeaderProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onBrowse = pathname === "/" || pathname === "/browse";
  const search = useSearch({ strict: false }) as { q?: string };
  const [query, setQuery] = useState(onBrowse ? (search.q ?? "") : "");
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Keep the desktop input in sync when URL param changes externally.
  useEffect(() => {
    if (onBrowse) setQuery(search.q ?? "");
  }, [onBrowse, search.q]);

  const submitDesktopSearch = (value: string) => {
    const trimmed = value.trim();
    navigate({
      to: "/browse",
      search: (prev: Record<string, string>) => {
        const { q: _, ...rest } = prev;
        if (trimmed) return { ...rest, q: trimmed };
        return rest;
      },
    });
  };

  const handleSellClick = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    onSellClick();
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:gap-5 md:px-6">
        <Link to="/browse" className="flex shrink-0 items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-2xl font-extrabold tracking-tight text-primary">
            Marketplace
          </span>
        </Link>

        {/* Desktop inline search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitDesktopSearch(query);
          }}
          className="relative hidden max-w-[640px] flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, brands and sellers"
            className="h-10 rounded-full border-transparent bg-muted pl-10 transition-colors placeholder:text-muted-foreground focus-visible:border-input focus-visible:bg-background"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:flex-1 md:justify-end md:gap-2">
          {/* Mobile search icon → Spotlight-style modal */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSpotlightOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {isAuthenticated && (
            <Link
              to="/inbox"
              aria-label="Inbox"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:inline-flex"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          )}
          {isAuthenticated && <NotificationBell />}

          <Button
            onClick={handleSellClick}
            disabled={isLoggingIn}
            className="hidden h-10 gap-1 rounded-full px-4 text-sm font-bold md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Sell
          </Button>

          <ProfileMenu />
        </div>
      </div>

      <SearchSpotlight open={spotlightOpen} onOpenChange={setSpotlightOpen} />
    </header>
  );
}
