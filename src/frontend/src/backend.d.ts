import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Conversation {
    id: bigint;
    lastMessageAt: bigint;
    listingId: bigint;
    seller: Principal;
    buyer: Principal;
}
export interface PublicRating {
    review?: string;
    listingId: bigint;
    createdAt: bigint;
    reviewerUsername: string;
    stars: bigint;
    reviewer: Principal;
}
export interface Listing {
    id: bigint;
    status: ListingStatus;
    title: string;
    createdAt: bigint;
    description: string;
    seller: Principal;
    updatedAt: bigint;
    currency: string;
    category: Category;
    price: bigint;
    photos: Array<Media>;
}
export interface Report {
    id: bigint;
    status: ReportStatus;
    createdAt: bigint;
    description?: string;
    target: ReportTarget;
    reporter: Principal;
    reason: ReportReason;
}
export interface UserInfo {
    principal: Principal;
    joinDate: bigint;
    name: string;
    role: UserRole;
}
export interface PublicProfile {
    totalRatings: bigint;
    username: string;
    joinDate: bigint;
    name: string;
    profilePhoto?: ExternalBlob;
    activeListings: bigint;
    avgRating: bigint;
}
export interface Offer {
    id: bigint;
    status: OfferStatus;
    listingId: bigint;
    createdAt: bigint;
    counterAmount?: bigint;
    buyer: Principal;
    amount: bigint;
}
export interface Notification {
    id: bigint;
    notifType: NotificationType;
    createdAt: bigint;
    read: boolean;
    message: string;
    relatedId?: bigint;
}
export interface Message {
    id: bigint;
    content: string;
    sender: Principal;
    sentAt: bigint;
    conversationId: bigint;
}
export type ReportTarget = {
    __kind__: "listing";
    listing: bigint;
} | {
    __kind__: "user";
    user: Principal;
} | {
    __kind__: "rating";
    rating: {
        listingId: bigint;
        seller: Principal;
    };
};
export interface Media {
    hash: ExternalBlob;
    mediaType: string;
}
export interface UserProfile {
    latitude?: number;
    username: string;
    joinDate: bigint;
    name: string;
    profilePhoto?: ExternalBlob;
    longitude?: number;
    currency: string;
    location: string;
}
export enum Category {
    vehicles = "vehicles",
    other = "other",
    home = "home",
    toys = "toys",
    furniture = "furniture",
    books = "books",
    sports = "sports",
    fashion = "fashion",
    electronics = "electronics"
}
export enum ListingStatus {
    sold = "sold",
    reserved = "reserved",
    available = "available"
}
export enum NotificationType {
    offerAccepted = "offerAccepted",
    offerDeclined = "offerDeclined",
    savedListingSold = "savedListingSold",
    newOffer = "newOffer",
    savedListingPriceChanged = "savedListingPriceChanged",
    newMessage = "newMessage",
    offerCountered = "offerCountered"
}
export enum OfferResponse {
    accept = "accept",
    counter = "counter",
    decline = "decline"
}
export enum OfferStatus {
    pending = "pending",
    countered = "countered",
    accepted = "accepted",
    declined = "declined"
}
export enum ReportReason {
    other = "other",
    scam = "scam",
    spam = "spam",
    prohibited = "prohibited",
    offensive = "offensive"
}
export enum ReportStatus {
    pending = "pending",
    dismissed = "dismissed"
}
export enum SortOrder {
    newest = "newest",
    priceDesc = "priceDesc",
    priceAsc = "priceAsc"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminRemoveListing(listingId: bigint): Promise<void>;
    adminRemoveRating(seller: Principal, listingId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(user: Principal): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    browseListings(keyword: string | null, category: Category | null, minPrice: bigint | null, maxPrice: bigint | null, priceCurrency: string | null, sort: SortOrder | null, offset: bigint, limit: bigint): Promise<Array<Listing>>;
    createListing(title: string, description: string, price: bigint, currency: string, category: Category, photos: Array<Media>): Promise<Listing>;
    deleteListing(id: bigint): Promise<void>;
    dismissReport(reportId: bigint): Promise<void>;
    getAllListings(): Promise<Array<Listing>>;
    getBlockedUsers(): Promise<Array<Principal>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversations(): Promise<Array<Conversation>>;
    getListing(id: bigint): Promise<Listing | null>;
    getMessages(conversationId: bigint): Promise<Array<Message>>;
    getMyListings(): Promise<Array<Listing>>;
    getMyOffers(): Promise<Array<Offer>>;
    getMyRole(): Promise<UserRole>;
    getNotifications(): Promise<Array<Notification>>;
    getOffersForListing(listingId: bigint): Promise<Array<Offer>>;
    getPublicProfile(user: Principal): Promise<PublicProfile | null>;
    getReports(): Promise<Array<Report>>;
    getSavedListings(): Promise<Array<Listing>>;
    getSellerListings(seller: Principal, status: ListingStatus | null, offset: bigint, limit: bigint): Promise<Array<Listing>>;
    getSellerReviews(seller: Principal): Promise<Array<PublicRating>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUsers(): Promise<Array<UserInfo>>;
    isCallerAdmin(): Promise<boolean>;
    isUsernameAvailable(username: string): Promise<boolean>;
    makeOffer(listingId: bigint, amount: bigint): Promise<Offer>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(notifId: bigint): Promise<void>;
    rateSeller(listingId: bigint, stars: bigint, review: string | null): Promise<void>;
    reportListing(listingId: bigint, reason: ReportReason, description: string | null): Promise<void>;
    reportRating(seller: Principal, listingId: bigint, reason: ReportReason, description: string | null): Promise<void>;
    reportUser(user: Principal, reason: ReportReason, description: string | null): Promise<void>;
    respondToOffer(offerId: bigint, listingId: bigint, response: OfferResponse, counterAmount: bigint | null): Promise<Offer>;
    saveCallerUserProfile(name: string, username: string, profilePhoto: ExternalBlob | null, location: string, latitude: number | null, longitude: number | null, currency: string): Promise<void>;
    saveListing(listingId: bigint): Promise<void>;
    sendMessage(conversationId: bigint, content: string): Promise<Message>;
    startConversation(listingId: bigint): Promise<Conversation>;
    unbanUser(user: Principal): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
    unsaveListing(listingId: bigint): Promise<void>;
    updateListing(id: bigint, title: string, description: string, price: bigint, currency: string, category: Category, photos: Array<Media>, status: ListingStatus): Promise<Listing>;
}
