# Marketplace

## Overview

Marketplace is a peer-to-peer buy-and-sell platform built on the Internet Computer. Users authenticate via Internet Identity and can list items for sale, browse and search listings, make offers, negotiate with sellers, and communicate via in-app messaging. The app includes seller profiles with star ratings, saved items, notifications, user blocking, and a full admin moderation system. It is fully responsive across mobile and desktop.

## Authentication

- Authentication uses Internet Identity via the Caffeine authorization module (role-based access control).
- Three roles: **admin**, **user**, and **guest**.
- The first authenticated user who provides the correct admin token becomes admin. All other authenticated users are assigned the **user** role.
- Anonymous principals are treated as **guest** and cannot perform authenticated actions.
- Browsing and searching listings is public (no login required).
- Creating listings, messaging, making offers, saving items, rating, and reporting all require the **user** role.
- Banned users are demoted to **guest** role, which prevents all authenticated actions. Their existing listings are hidden from browse and search.

## Core Features

### User Profiles

Users set up a profile with:

- **Name** (required, max 100 characters)
- **Username** (required, 3–30 characters, lowercase letters/digits/underscore/hyphen only, must be unique)
- **Profile photo** (optional, stored via blob storage)
- **Location** (optional text, max 200 characters)
- **Coordinates** (optional latitude/longitude pair — both must be provided together; latitude -90 to 90, longitude -180 to 180; rounded to 2 decimal places for ~1 km privacy)
- **Currency** (ISO 4217 3-letter uppercase code, e.g. USD, EUR)
- **Join date** (set automatically on first profile save, preserved on subsequent edits)

Username changes release the old username for others. Username availability can be checked without authentication.

### Listings

Sellers can create listings with:

- **Title** (required, max 200 characters)
- **Description** (optional, max 5,000 characters)
- **Price** (required, natural number — whole units in the selected currency)
- **Currency** (ISO 4217 3-letter code; also updates the seller's profile default currency)
- **Category**: Electronics, Furniture, Fashion, Sports, Books, Vehicles, Home, Toys, or Other
- **Photos** (1–10 required; must have `image/*` media type; stored via blob storage)

Listing statuses:

- **Available** — appears in browse/search results
- **Reserved** — set automatically when an offer is accepted; seller can also set manually
- **Sold** — terminal state; cannot be changed back

Sellers can edit all fields of their own listings and change status (except reverting from Sold). Sellers can delete their own listings.

**On deletion:** offers, saved items, and conversations tied to that listing are cleaned up. Buyer offer indexes are also removed.

### Browse and Discovery

- Public endpoint (no login required).
- Keyword search matches against listing title, description, seller username, and seller name (case-insensitive).
- Filters: category, min price, max price. A currency filter applies only when a price bound is set.
- Sort options: Newest (default), Price Low to High, Price High to Low.
- Pagination via offset and limit parameters.
- Listings from banned users (guest role) and from users the caller has blocked are excluded.
- Only **Available** listings appear in results.

### Offers

- Buyers can make an offer on any Available listing with a proposed price (must be > 0).
- Cannot make an offer on your own listing.
- Only one active (pending) offer per buyer per listing.
- Blocked users cannot make offers to each other.

Seller responses:

- **Accept** — listing status changes to Reserved; all other pending/accepted offers on the listing are auto-declined with notifications.
- **Decline** — no listing status change.
- **Counter** — requires a counter amount (> 0); offer status becomes Countered.

Buyers can view all their sent offers (sorted newest first). Sellers can view all offers on a listing (sorted by amount descending).

### Messaging

- Buyers initiate a conversation from a listing detail page.
- Cannot start a conversation on your own listing.
- Conversations are deduplicated: same buyer + seller + listing reuses existing conversation.
- Blocked users cannot message each other.
- Messages: max 2,000 characters, cannot be empty.
- Conversations are sorted by most recent message. Messages within a conversation are chronological.
- **On listing deletion:** associated conversations and messages are removed.

### Saved Items

- Authenticated users can save/unsave any listing.
- Saved listings page shows all saved items sorted by newest listing first.
- If a saved listing's price changes, savers receive a notification.
- If a saved listing is marked as Sold, savers receive a notification.
- If a saved listing is deleted, the save reference is cleaned up silently.

### Notifications

Types:

- **New offer** — seller notified when a buyer makes an offer
- **Offer accepted/declined/countered** — buyer notified of seller's response
- **New message** — recipient notified with sender name and listing title
- **Saved listing price changed** — notified with new price
- **Saved listing sold** — notified that the item has been sold

Each notification has: type, message text, optional related ID (listing or conversation), read status, and timestamp.

- Users can mark individual notifications as read or mark all as read.
- Notifications are capped at **200 per user** — oldest notifications are dropped when the cap is exceeded.
- Sorted newest first when retrieved.

### Ratings and Reviews

- After a listing is marked as Sold, the buyer (must have an accepted offer on the listing) can leave a rating.
- Rating: **1–5 stars** (required) and an optional review text (max 1,000 characters).
- Cannot rate yourself. One rating per buyer per listing.
- Public profiles display average rating (stored as tenths of a star, 0–50, for one-decimal precision) and total rating count.
- Admin-removed ratings are excluded from average calculations and public display.
- Seller reviews are publicly visible with reviewer username, stars, review text, and date.

### Reporting

Users can report:

- **Listings** — listing must exist
- **Users** — cannot report yourself
- **Ratings** — rating must exist

Report reasons: Spam, Offensive content, Scam or fraud, Prohibited item, Other.

- Optional description (max 1,000 characters).
- One pending report per reporter per target (prevents duplicate reports).
- Reports start as **Pending** and can be dismissed by admin.

### Blocking

- Users can block/unblock other users (cannot block yourself).
- Blocked users cannot: message, make offers, or appear in browse results for the blocker.
- Block checks are bidirectional for offers and messaging (either party blocking prevents interaction).
- Users can view their blocked users list.

### Admin and Moderation

Admin capabilities:

- **View reports** — all pending reports, sorted newest first
- **Dismiss report** — changes status to Dismissed
- **Remove listing** — deletes listing regardless of ownership, cleans up all references, auto-dismisses related pending reports
- **Remove rating** — soft-removes a rating (excluded from averages and public display), uses a removed-ratings index
- **Ban user** — demotes to guest role, auto-dismisses related pending reports; cannot ban another admin
- **Unban user** — restores to user role
- **View all users** — lists all users with principal, name, role, and join date
- **View all listings** — lists every listing regardless of status (sorted newest first)

## Backend Data Storage

All state is persisted on-chain via Motoko orthogonal persistence:

| Data                      | Storage                                  | Key                                 |
| ------------------------- | ---------------------------------------- | ----------------------------------- |
| User profiles             | `Map<Principal, UserProfile>`            | Principal                           |
| Username index            | `Map<Text, Principal>`                   | Lowercase username                  |
| Listings                  | `Map<Nat, Listing>`                      | Auto-incrementing ID                |
| User listing index        | `Map<Principal, Map<Nat, ()>>`           | Principal -> listing IDs            |
| Offers per listing        | `Map<Nat, Map<Nat, Offer>>`              | Listing ID -> offer ID              |
| User offer index          | `Map<Principal, Map<Nat, Nat>>`          | Principal -> offer ID -> listing ID |
| Conversations             | `Map<Nat, Conversation>`                 | Auto-incrementing ID                |
| Messages per conversation | `Map<Nat, List<Message>>`                | Conversation ID                     |
| User conversation index   | `Map<Principal, Map<Nat, ()>>`           | Principal -> conversation IDs       |
| Saved listings            | `Map<Principal, Map<Nat, ()>>`           | Principal -> listing IDs            |
| Notifications             | `Map<Principal, Map<Nat, Notification>>` | Principal -> notification ID        |
| Seller ratings            | `Map<Principal, List<Rating>>`           | Seller principal                    |
| Removed ratings           | `Map<Text, ()>`                          | "principal:listingId" key           |
| Reports                   | `Map<Nat, Report>`                       | Auto-incrementing ID                |
| Blocked users             | `Map<Principal, Map<Principal, ()>>`     | Blocker -> blocked                  |
| Access control state      | `AccessControlState`                     | Role-based access                   |

Blob storage is handled via `MixinStorage()` for photos and profile images.

## Backend Operations

- **Authentication**: `requireAuth` checks caller is not anonymous. `requireUser` additionally checks user role. `requireAdmin` checks admin role.
- **Input validation**: All text fields have character limits enforced via `Runtime.trap()`. Username format is validated (3–30 chars, lowercase alphanumeric + underscore/hyphen). Currency is validated as 3-letter uppercase ISO code. Coordinates validated for range and must be provided as a pair.
- **Status transitions**: Sold listings cannot have their status changed back. Accepted offers auto-reserve the listing and auto-decline other offers.
- **Cleanup on deletion**: Listing deletion cascades to offers (including buyer offer indexes), saved items, conversations, and messages.
- **Coordinate rounding**: Latitude/longitude rounded to 2 decimal places (~1 km precision) for privacy.

## User Interface

### Pages and Routes

| Route            | Auth Required | Description                                            |
| ---------------- | ------------- | ------------------------------------------------------ |
| `/`              | No            | Landing page (redirects to /browse if authenticated)   |
| `/browse`        | No            | Browsable listing feed with search, filters, sort      |
| `/listing/:id`   | No            | Listing detail with photos, seller info, actions       |
| `/profile/:id`   | No            | Public seller profile with ratings and listings        |
| `/my-listings`   | Yes           | Seller's own listings management                       |
| `/inbox`         | Yes           | All conversations                                      |
| `/inbox/:id`     | Yes           | Chat thread for a conversation                         |
| `/saved`         | Yes           | Saved/bookmarked listings                              |
| `/offers`        | Yes           | Buyer's sent offers                                    |
| `/notifications` | Yes           | All notifications                                      |
| `/blocked`       | Yes           | Blocked users management                               |
| `/admin`         | Yes (admin)   | Admin dashboard with reports, users, ratings, listings |

### Key Components

- **LandingPage** — unauthenticated welcome page
- **BrowsePage** — listing grid with keyword search, category rail, price filter, sort, distance radius
- **BrowseListingCard** — card showing photo, title, price, seller info
- **ListingDetail** — full listing view with photo gallery, seller profile link, offers panel, messaging, save/report actions
- **CreateListingDialog / EditListingDialog** — listing form with photo upload grid, category picker, currency combobox
- **PhotoUploadGrid / PhotoGallery** — multi-photo upload and display
- **MakeOfferDialog** — submit an offer on a listing
- **OffersPanel** — seller view of all offers with accept/decline/counter
- **ChatView / ChatHeader / MessageThread / MessageInput** — messaging UI
- **PublicProfilePage / ProfileHeader / ProfileStats** — public seller profile
- **ReviewsSection / ReviewItem / StarRating / RateSellerDialog** — ratings and reviews
- **SearchSpotlight** — keyboard-accessible search overlay
- **CategoryRail** — horizontal scrollable category filter
- **PriceFilter / BrowseFilterBar** — price range and filter controls
- **CurrencyCombobox** — searchable currency selector (all ISO 4217 codes)
- **LocationPicker** — location selection with Leaflet map integration
- **NotificationBell / NotificationsPage** — notification center
- **ProfileMenu / ProfileSetupDialog / EditProfileDialog** — profile management
- **ReportDialog** — report listings, users, or ratings
- **AdminDashboard** — tabbed admin panel for reports, users, ratings, listings
- **MobileBottomNav** — bottom navigation bar for mobile
- **ThemeToggle** — light/dark theme switcher

### Navigation

- Hash-based routing via TanStack Router
- Desktop: header with navigation links + profile menu
- Mobile: bottom navigation bar
- 404 page with link back to browse

## Design System

- Built with shadcn/ui components and Tailwind CSS
- Light/dark theme support via next-themes
- Toast notifications via Sonner (bottom-right position)
- Responsive layout — mobile-first with desktop enhancements
- Leaflet maps loaded via CDN for location picking
- Category icons from Lucide React

## Error Handling

- **Authentication errors**: "Not authenticated" trap for anonymous callers on protected endpoints
- **Authorization errors**: "Unauthorized" trap for guest-role users on user endpoints; "Admin access required" for admin endpoints
- **Validation errors**: Specific trap messages for each field constraint (empty title, title too long, invalid username format, invalid currency, coordinates out of range, etc.)
- **Not found errors**: "Listing not found", "Offer not found", "Conversation not found", "Notification not found", "Report not found", "Rating not found"
- **Business rule errors**: "Cannot make an offer on your own listing", "You already have an active offer on this listing", "Cannot rate yourself", "Can only rate sellers of sold listings", "Only the buyer can rate the seller", "Cannot block yourself", "Cannot report yourself", "Cannot ban an admin", "Cannot change status of a sold listing"
- **Block errors**: "Cannot make an offer — user is blocked", "Cannot message — user is blocked", "Cannot send message — user is blocked"
- **Duplicate report prevention**: "You already have a pending report for this listing/user/rating"
