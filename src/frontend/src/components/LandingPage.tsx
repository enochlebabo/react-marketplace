import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  Loader2,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { ThemeToggle } from "./ThemeToggle";

const categories = [
  { label: "Goods", icon: Package, active: true },
  { label: "Electronics", icon: Smartphone },
  { label: "Fashion", icon: Shirt },
  { label: "Furniture", icon: Sofa },
  { label: "Services", icon: Wrench },
  { label: "Food", icon: UtensilsCrossed },
];

export function LandingPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="h-dvh bg-landing relative flex flex-col overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Decorative curved accent - top right */}
      <div className="absolute -top-20 -right-20 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-primary/10 pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-56 h-56 sm:w-96 sm:h-96 rounded-full border-[3px] border-primary/20 pointer-events-none" />

      {/* Decorative curved accent - bottom left */}
      <div className="absolute -bottom-24 -left-24 w-40 h-40 sm:w-72 sm:h-72 rounded-full bg-primary/8 pointer-events-none" />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-16 px-4 sm:px-12 lg:px-20 relative z-10">
        {/* Left side - Text content */}
        <div className="max-w-xl text-center lg:text-left">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 sm:mb-10 justify-center lg:justify-start animate-fade-up">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-xl tracking-tight">
              Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-delay-1">
            <span className="block text-3xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
              Your Community
            </span>
            <span className="block text-3xl sm:text-5xl md:text-6xl font-serif italic text-primary leading-[1.1] mt-1">
              Marketplace
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-sm sm:text-lg max-w-md mt-4 sm:mt-6 mx-auto lg:mx-0 animate-fade-up-delay-2">
            List your items, discover deals, and connect with buyers and sellers
            directly. No middlemen, no fees.
          </p>

          {/* CTA Buttons */}
          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 animate-fade-up-delay-3 justify-center lg:justify-start">
            <Button
              onClick={() => login()}
              disabled={isLoggingIn}
              size="lg"
              className="rounded-full px-8 h-12 text-base shadow-md"
            >
              {isLoggingIn && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isLoggingIn ? "Signing in..." : "Get Started"}
            </Button>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
              Browse Listings
            </Link>
          </div>
        </div>

        {/* Right side - Category hexagons */}
        <div className="flex-1 max-w-sm w-full animate-fade-up-delay-3 hidden sm:block">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {categories.map(({ label, icon: Icon, active }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center aspect-square rounded-2xl border border-border bg-card shadow-sm p-3 sm:p-4 transition-colors hover:border-primary/40"
                style={
                  active
                    ? {
                        background: "var(--primary)",
                        borderColor: "var(--primary)",
                      }
                    : undefined
                }
              >
                <Icon
                  className={cn(
                    "w-6 h-6 sm:w-7 sm:h-7 mb-2",
                    active ? "text-primary-foreground" : "text-primary",
                  )}
                />
                <span
                  className={cn(
                    "text-xs sm:text-sm font-medium",
                    active ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile category pills (shown instead of grid on small screens) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:hidden animate-fade-up-delay-3">
          {categories.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm shadow-xs",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-4 sm:pb-6 text-center text-muted-foreground text-sm">
        &copy; 2026. Built by Enoch Lebabo @2026 {" "}
        <a
          href="https://enochlebabo.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline"
        >
          enochlebabo_portfolio
        </a>
      </footer>
    </div>
  );
}
