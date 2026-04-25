import {
  Link,
  Navigate,
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AdminDashboard } from "./components/AdminDashboard";
import { AppLayout } from "./components/AppLayout";
import { BlockedUsersPage } from "./components/BlockedUsersPage";
import { BrowsePage } from "./components/BrowsePage";
import { ChatView } from "./components/ChatView";
import { InboxPage } from "./components/InboxPage";
import { LandingPage } from "./components/LandingPage";
import { ListingDetail } from "./components/ListingDetail";
import { MyListingsPage } from "./components/MyListingsPage";
import { MyOffersPage } from "./components/MyOffersPage";
import { NotificationsPage } from "./components/NotificationsPage";
import { PublicProfilePage } from "./components/PublicProfilePage";
import { RequireAuth } from "./components/RequireAuth";
import { SavedItemsPage } from "./components/SavedItemsPage";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

// Bare root — no layout, just renders child routes
const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: function NotFound() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center bg-background">
        <p className="text-4xl font-bold">404</p>
        <p className="text-muted-foreground">This page doesn&apos;t exist.</p>
        <Link to="/browse" className="text-primary hover:underline text-sm">
          Go to Browse
        </Link>
      </div>
    );
  },
});

// `/` — Landing page (no layout), authenticated redirects to /browse
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function IndexRoute() {
    const { identity } = useInternetIdentity();
    if (identity) {
      return <Navigate to="/browse" />;
    }
    return <LandingPage />;
  },
});

// Layout route — all app pages wrapped in AppLayout
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: function LayoutRoute() {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  },
});

interface BrowseSearchParams {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  priceCurrency?: string;
  sort?: string;
  radius?: string;
}

const validateBrowseSearch = (
  search: Record<string, unknown>,
): BrowseSearchParams => ({
  q: typeof search.q === "string" ? search.q : undefined,
  category: typeof search.category === "string" ? search.category : undefined,
  minPrice: typeof search.minPrice === "string" ? search.minPrice : undefined,
  maxPrice: typeof search.maxPrice === "string" ? search.maxPrice : undefined,
  priceCurrency:
    typeof search.priceCurrency === "string" ? search.priceCurrency : undefined,
  sort: typeof search.sort === "string" ? search.sort : undefined,
  radius: typeof search.radius === "string" ? search.radius : undefined,
});

// Public routes (inside AppLayout)

const browseRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "browse",
  validateSearch: validateBrowseSearch,
  component: function BrowseRoute() {
    const searchParams = browseRoute.useSearch();
    return <BrowsePage searchParams={searchParams} />;
  },
});

const listingDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "listing/$id",
  component: function ListingDetailRoute() {
    const { id } = listingDetailRoute.useParams();
    return <ListingDetail id={id} />;
  },
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "profile/$id",
  component: function ProfileRoute() {
    const { id } = profileRoute.useParams();
    return <PublicProfilePage id={id} />;
  },
});

// Protected routes (inside AppLayout + RequireAuth)

const myListingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "my-listings",
  component: function MyListingsRoute() {
    return (
      <RequireAuth>
        <MyListingsPage />
      </RequireAuth>
    );
  },
});

const inboxRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "inbox",
  component: function InboxRoute() {
    return (
      <RequireAuth>
        <InboxPage />
      </RequireAuth>
    );
  },
});

const chatRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "inbox/$id",
  component: function ChatViewRoute() {
    const { id } = chatRoute.useParams();
    return (
      <RequireAuth>
        <ChatView id={id} />
      </RequireAuth>
    );
  },
});

const savedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "saved",
  component: function SavedRoute() {
    return (
      <RequireAuth>
        <SavedItemsPage />
      </RequireAuth>
    );
  },
});

const offersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "offers",
  component: function OffersRoute() {
    return (
      <RequireAuth>
        <MyOffersPage />
      </RequireAuth>
    );
  },
});

const notificationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "notifications",
  component: function NotificationsRoute() {
    return (
      <RequireAuth>
        <NotificationsPage />
      </RequireAuth>
    );
  },
});

const blockedRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "blocked",
  component: function BlockedRoute() {
    return (
      <RequireAuth>
        <BlockedUsersPage />
      </RequireAuth>
    );
  },
});

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "admin",
  component: function AdminRoute() {
    return (
      <RequireAuth>
        <AdminDashboard />
      </RequireAuth>
    );
  },
});

// Route tree: index (no layout) + app layout with all other routes
const routeTree = rootRoute.addChildren([
  indexRoute,
  appLayoutRoute.addChildren([
    browseRoute,
    listingDetailRoute,
    myListingsRoute,
    inboxRoute,
    chatRoute,
    savedRoute,
    offersRoute,
    notificationsRoute,
    profileRoute,
    blockedRoute,
    adminRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
