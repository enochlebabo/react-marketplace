import { type ReactNode, createContext, useContext, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useProfile } from "../hooks/useQueries";
import { CategoryRail } from "./CategoryRail";
import { CreateListingDialog } from "./CreateListingDialog";
import { MarketplaceHeader } from "./MarketplaceHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { ProfileSetupDialog } from "./ProfileSetupDialog";

interface SellDialogContextValue {
  openSellDialog: () => void;
}

const SellDialogContext = createContext<SellDialogContextValue | null>(null);

export function useSellDialog(): SellDialogContextValue {
  const ctx = useContext(SellDialogContext);
  if (!ctx) {
    throw new Error("useSellDialog must be used inside AppLayout");
  }
  return ctx;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [sellOpen, setSellOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile } = useProfile();
  const needsProfileSetup =
    isAuthenticated && profile !== undefined && !profile?.name;

  // Gate the whole shell behind profile setup — we don't want the "?" avatar
  // or browse content flashing behind the required dialog.
  if (needsProfileSetup) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileSetupDialog open />
      </div>
    );
  }

  return (
    <SellDialogContext.Provider
      value={{ openSellDialog: () => setSellOpen(true) }}
    >
      <div className="min-h-screen overflow-x-hidden bg-background">
        <MarketplaceHeader onSellClick={() => setSellOpen(true)} />
        <CategoryRail />

        <main className="mx-auto max-w-[1400px] px-3 pb-20 sm:px-4 md:px-6 md:pb-10">
          {children}
        </main>

        <MobileBottomNav onSellClick={() => setSellOpen(true)} />

        <CreateListingDialog open={sellOpen} onOpenChange={setSellOpen} />
      </div>
    </SellDialogContext.Provider>
  );
}
