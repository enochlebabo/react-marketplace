import Float "mo:core/Float";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // Types

  type UserProfile = {
    name : Text;
    username : Text;
    profilePhoto : ?Storage.ExternalBlob;
    joinDate : Int;
    location : Text;
    latitude : ?Float;
    longitude : ?Float;
    currency : Text;
  };

  type Rating = {
    listingId : Nat;
    reviewer : Principal;
    stars : Nat;
    review : ?Text;
    createdAt : Int;
  };

  type PublicRating = {
    listingId : Nat;
    reviewer : Principal;
    reviewerUsername : Text;
    stars : Nat;
    review : ?Text;
    createdAt : Int;
  };

  type PublicProfile = {
    name : Text;
    username : Text;
    profilePhoto : ?Storage.ExternalBlob;
    joinDate : Int;
    avgRating : Nat;
    totalRatings : Nat;
    activeListings : Nat;
  };

  type Category = {
    #electronics;
    #furniture;
    #fashion;
    #sports;
    #books;
    #vehicles;
    #home;
    #toys;
    #other;
  };

  type SortOrder = {
    #newest;
    #priceAsc;
    #priceDesc;
  };

  type ListingStatus = {
    #available;
    #reserved;
    #sold;
  };

  type OfferStatus = {
    #pending;
    #accepted;
    #declined;
    #countered;
  };

  type OfferResponse = {
    #accept;
    #decline;
    #counter;
  };

  type Offer = {
    id : Nat;
    listingId : Nat;
    buyer : Principal;
    amount : Nat;
    counterAmount : ?Nat;
    status : OfferStatus;
    createdAt : Int;
  };

  type Conversation = {
    id : Nat;
    listingId : Nat;
    buyer : Principal;
    seller : Principal;
    lastMessageAt : Int;
  };

  type Message = {
    id : Nat;
    conversationId : Nat;
    sender : Principal;
    content : Text;
    sentAt : Int;
  };

  type NotificationType = {
    #newOffer;
    #offerAccepted;
    #offerDeclined;
    #offerCountered;
    #newMessage;
    #savedListingPriceChanged;
    #savedListingSold;
  };

  type Notification = {
    id : Nat;
    notifType : NotificationType;
    message : Text;
    relatedId : ?Nat;
    read : Bool;
    createdAt : Int;
  };

  type ReportReason = {
    #spam;
    #offensive;
    #scam;
    #prohibited;
    #other;
  };

  type ReportTarget = {
    #listing : Nat;
    #user : Principal;
    #rating : { seller : Principal; listingId : Nat };
  };

  type ReportStatus = {
    #pending;
    #dismissed;
  };

  type Report = {
    id : Nat;
    reporter : Principal;
    target : ReportTarget;
    reason : ReportReason;
    description : ?Text;
    status : ReportStatus;
    createdAt : Int;
  };

  type Media = {
    hash : Storage.ExternalBlob;
    mediaType : Text;
  };

  type Listing = {
    id : Nat;
    seller : Principal;
    title : Text;
    description : Text;
    price : Nat;
    currency : Text;
    category : Category;
    status : ListingStatus;
    photos : [Media];
    createdAt : Int;
    updatedAt : Int;
  };

  // State

  var accessControlState : AccessControl.AccessControlState = AccessControl.initState();
  var userProfiles : Map.Map<Principal, UserProfile> = Map.empty();
  var listings : Map.Map<Nat, Listing> = Map.empty();
  var userListings : Map.Map<Principal, Map.Map<Nat, ()>> = Map.empty();
  var nextListingId : Nat = 0;
  var listingOffers : Map.Map<Nat, Map.Map<Nat, Offer>> = Map.empty();
  var nextOfferId : Nat = 0;
  var conversations : Map.Map<Nat, Conversation> = Map.empty();
  var conversationMessages : Map.Map<Nat, List.List<Message>> = Map.empty();
  var userConversations : Map.Map<Principal, Map.Map<Nat, ()>> = Map.empty();
  var nextConversationId : Nat = 0;
  var nextMessageId : Nat = 0;
  var userSavedListings : Map.Map<Principal, Map.Map<Nat, ()>> = Map.empty();
  var userNotifications : Map.Map<Principal, Map.Map<Nat, Notification>> = Map.empty();
  var nextNotificationId : Nat = 0;
  var sellerRatings : Map.Map<Principal, List.List<Rating>> = Map.empty();
  var reports : Map.Map<Nat, Report> = Map.empty();
  var nextReportId : Nat = 0;
  var userBlocked : Map.Map<Principal, Map.Map<Principal, ()>> = Map.empty();
  var removedRatings : Map.Map<Text, ()> = Map.empty();
  var usernamesToPrincipals : Map.Map<Text, Principal> = Map.empty();
  var userOfferIndex : Map.Map<Principal, Map.Map<Nat, Nat>> = Map.empty();

  include MixinAuthorization(accessControlState);

  // Helpers

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func requireUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
  };

  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Admin access required");
    };
  };

  func ratingKey(seller : Principal, listingId : Nat) : Text {
    seller.toText() # ":" # listingId.toText();
  };

  func isRatingRemoved(seller : Principal, listingId : Nat) : Bool {
    removedRatings.get(ratingKey(seller, listingId)) != null;
  };

  func containsIgnoreCase(haystack : Text, needle : Text) : Bool {
    haystack.toLower().contains(#text(needle.toLower()));
  };

  // Usernames: 3-30 chars, lowercase letters, digits, underscore, or hyphen.
  // Caller passes the normalized (lowercased) form — UI handles the lowercasing.
  func validateUsername(username : Text) {
    if (username.size() < 3) {
      Runtime.trap("Username must be at least 3 characters");
    };
    if (username.size() > 30) {
      Runtime.trap("Username must be 30 characters or fewer");
    };
    for (c in username.chars()) {
      let code = c.toNat32();
      let isLower = code >= 97 and code <= 122;
      let isDigit = code >= 48 and code <= 57;
      let isUnderscore = code == 95;
      let isHyphen = code == 45;
      if (not (isLower or isDigit or isUnderscore or isHyphen)) {
        Runtime.trap("Username can only contain lowercase letters, digits, underscore, or hyphen");
      };
    };
  };

  // Currency: ISO 4217 3-letter uppercase code (USD, EUR, JPY, ...).
  // Kept as Text so the set is extensible without backend changes.
  func validateCurrency(currency : Text) {
    if (currency.size() != 3) {
      Runtime.trap("Currency must be a 3-letter ISO code");
    };
    for (c in currency.chars()) {
      let code = c.toNat32();
      let isUpper = code >= 65 and code <= 90;
      if (not isUpper) {
        Runtime.trap("Currency must be uppercase ISO 3-letter code");
      };
    };
  };

  func validateCoordinates(latitude : ?Float, longitude : ?Float) {
    switch (latitude, longitude) {
      case ((?lat), (?lng)) {
        if (lat < -90.0 or lat > 90.0) {
          Runtime.trap("Latitude must be between -90 and 90");
        };
        if (lng < -180.0 or lng > 180.0) {
          Runtime.trap("Longitude must be between -180 and 180");
        };
      };
      case ((null), (null)) {};
      case (_, _) {
        Runtime.trap("Latitude and longitude must be provided together");
      };
    };
  };

  func validatePhotos(photos : [Media]) {
    if (photos.size() == 0) {
      Runtime.trap("At least one photo is required");
    };
    if (photos.size() > 10) {
      Runtime.trap("Maximum 10 photos allowed");
    };
    for (photo in photos.vals()) {
      if (not photo.mediaType.startsWith(#text("image"))) {
        Runtime.trap("Only image media type is allowed for photos");
      };
    };
  };

  // Round to 2 decimal places (~1km precision) for approximate location
  func roundCoord(v : Float) : Float {
    Float.nearest(v * 100.0) / 100.0;
  };

  func getUserListingIds(user : Principal) : Map.Map<Nat, ()> {
    switch (userListings.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, ()>();
        userListings.add(user, m);
        m;
      };
    };
  };

  func getUserConversationIds(user : Principal) : Map.Map<Nat, ()> {
    switch (userConversations.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, ()>();
        userConversations.add(user, m);
        m;
      };
    };
  };

  func getConversationMessages(convId : Nat) : List.List<Message> {
    switch (conversationMessages.get(convId)) {
      case (?l) { l };
      case (null) {
        let l = List.empty<Message>();
        conversationMessages.add(convId, l);
        l;
      };
    };
  };

  func getUserSavedIds(user : Principal) : Map.Map<Nat, ()> {
    switch (userSavedListings.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, ()>();
        userSavedListings.add(user, m);
        m;
      };
    };
  };

  func getUserNotifications(user : Principal) : Map.Map<Nat, Notification> {
    switch (userNotifications.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Notification>();
        userNotifications.add(user, m);
        m;
      };
    };
  };

  func addNotification(recipient : Principal, notifType : NotificationType, message : Text, relatedId : ?Nat) {
    let id = nextNotificationId;
    nextNotificationId += 1;
    let notif : Notification = {
      id;
      notifType;
      message;
      relatedId;
      read = false;
      createdAt = Time.now();
    };
    let notifs = getUserNotifications(recipient);
    notifs.add(id, notif);
    // Cap at 200 — drop oldest by ID (lowest IDs are oldest)
    if (notifs.size() > 200) {
      let sorted = List.empty<Nat>();
      for ((nid, _) in notifs.entries()) {
        sorted.add(nid);
      };
      sorted.sortInPlace(func(a, b) { Nat.compare(a, b) });
      let toRemove = notifs.size() - 200;
      var removed : Nat = 0;
      for (nid in sorted.values()) {
        if (removed < toRemove) {
          notifs.remove(nid);
          removed += 1;
        };
      };
    };
  };

  func getSellerRatings(seller : Principal) : List.List<Rating> {
    switch (sellerRatings.get(seller)) {
      case (?l) { l };
      case (null) {
        let l = List.empty<Rating>();
        sellerRatings.add(seller, l);
        l;
      };
    };
  };

  func getUserBlockedSet(user : Principal) : Map.Map<Principal, ()> {
    switch (userBlocked.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Principal, ()>();
        userBlocked.add(user, m);
        m;
      };
    };
  };

  func isBlocked(blocker : Principal, target : Principal) : Bool {
    getUserBlockedSet(blocker).get(target) != null;
  };

  func getListingOffers(listingId : Nat) : Map.Map<Nat, Offer> {
    switch (listingOffers.get(listingId)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Offer>();
        listingOffers.add(listingId, m);
        m;
      };
    };
  };

  func getUserOfferIndex(user : Principal) : Map.Map<Nat, Nat> {
    switch (userOfferIndex.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, Nat>();
        userOfferIndex.add(user, m);
        m;
      };
    };
  };

  // Remove all references to a listing when it is deleted or admin-removed.
  // Conversations are intentionally preserved (spec requires deal history to persist).
  func cleanupListingReferences(listingId : Nat) {
    // Clean up buyer offer indexes before removing listing offers
    switch (listingOffers.get(listingId)) {
      case (?offers) {
        for ((offerId, offer) in offers.entries()) {
          switch (userOfferIndex.get(offer.buyer)) {
            case (?idx) { idx.remove(offerId) };
            case (null) {};
          };
        };
      };
      case (null) {};
    };
    listingOffers.remove(listingId);
    for ((_, savedIds) in userSavedListings.entries()) {
      savedIds.remove(listingId);
    };
    // Clean up conversations for this listing
    for ((convId, conv) in conversations.entries()) {
      if (conv.listingId == listingId) {
        conversationMessages.remove(convId);
        getUserConversationIds(conv.buyer).remove(convId);
        getUserConversationIds(conv.seller).remove(convId);
        conversations.remove(convId);
      };
    };
  };

  func reportTargetsMatch(a : ReportTarget, b : ReportTarget) : Bool {
    switch (a, b) {
      case (#listing(x), #listing(y)) { x == y };
      case (#user(x), #user(y)) { x == y };
      case (#rating(x), #rating(y)) {
        x.seller == y.seller and x.listingId == y.listingId
      };
      case (_, _) { false };
    };
  };

  func hasPendingReport(reporter : Principal, target : ReportTarget) : Bool {
    for ((_, r) in reports.entries()) {
      if (r.reporter == reporter and r.status == #pending and reportTargetsMatch(r.target, target)) {
        return true;
      };
    };
    false;
  };

  // Auto-dismiss any pending reports for the given target.
  // Called when admin takes a concrete action (remove listing / ban user)
  // so the report queue doesn't keep surfacing already-resolved items.
  func dismissReportsForTarget(target : ReportTarget) {
    for ((id, r) in reports.entries()) {
      if (r.status == #pending and reportTargetsMatch(r.target, target)) {
        reports.add(
          id,
          {
            id = r.id;
            reporter = r.reporter;
            target = r.target;
            reason = r.reason;
            description = r.description;
            status = #dismissed;
            createdAt = r.createdAt;
          },
        );
      };
    };
  };

  // Endpoints — Profile

  public query ({ caller }) func getMyRole() : async AccessControl.UserRole {
    requireAuth(caller);
    AccessControl.getUserRole(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(
    name : Text,
    username : Text,
    profilePhoto : ?Storage.ExternalBlob,
    location : Text,
    latitude : ?Float,
    longitude : ?Float,
    currency : Text,
  ) : async () {
    requireUser(caller);
    if (name == "") {
      Runtime.trap("Name cannot be empty");
    };
    if (name.size() > 100) {
      Runtime.trap("Name must be 100 characters or fewer");
    };
    let normalizedUsername = username.toLower();
    validateUsername(normalizedUsername);
    // Uniqueness — another principal can't already own this username
    switch (usernamesToPrincipals.get(normalizedUsername)) {
      case (?owner) {
        if (owner != caller) {
          Runtime.trap("Username is already taken");
        };
      };
      case (null) {};
    };
    if (location.size() > 200) {
      Runtime.trap("Location must be 200 characters or fewer");
    };
    validateCoordinates(latitude, longitude);
    validateCurrency(currency);
    let joinDate = switch (userProfiles.get(caller)) {
      case (?existing) {
        // If the user is changing their username, release the old index entry
        if (existing.username != normalizedUsername and existing.username != "") {
          usernamesToPrincipals.remove(existing.username);
        };
        existing.joinDate;
      };
      case (null) { Time.now() };
    };
    usernamesToPrincipals.add(normalizedUsername, caller);
    userProfiles.add(
      caller,
      {
        name;
        username = normalizedUsername;
        profilePhoto;
        joinDate;
        location;
        latitude = switch (latitude) {
          case (?lat) { ?roundCoord(lat) };
          case (null) { null };
        };
        longitude = switch (longitude) {
          case (?lng) { ?roundCoord(lng) };
          case (null) { null };
        };
        currency;
      },
    );
  };

  // Update just the currency preference — called as a side-effect of
  // createListing/updateListing so the user's default tracks what they
  // last picked. Silently no-ops when the user has no profile yet.
  func updateProfileCurrency(user : Principal, currency : Text) {
    switch (userProfiles.get(user)) {
      case (?existing) {
        if (existing.currency != currency) {
          userProfiles.add(
            user,
            {
              name = existing.name;
              username = existing.username;
              profilePhoto = existing.profilePhoto;
              joinDate = existing.joinDate;
              location = existing.location;
              latitude = existing.latitude;
              longitude = existing.longitude;
              currency;
            },
          );
        };
      };
      case (null) {};
    };
  };

  public query func isUsernameAvailable(username : Text) : async Bool {
    let normalized = username.toLower();
    switch (usernamesToPrincipals.get(normalized)) {
      case (?_) { false };
      case (null) { true };
    };
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  // Endpoints — Listings

  public shared ({ caller }) func createListing(
    title : Text,
    description : Text,
    price : Nat,
    currency : Text,
    category : Category,
    photos : [Media],
  ) : async Listing {
    requireUser(caller);
    if (title == "") {
      Runtime.trap("Title cannot be empty");
    };
    if (title.size() > 200) {
      Runtime.trap("Title must be 200 characters or fewer");
    };
    if (description.size() > 5000) {
      Runtime.trap("Description must be 5000 characters or fewer");
    };
    validateCurrency(currency);
    validatePhotos(photos);
    let now = Time.now();
    let id = nextListingId;
    nextListingId += 1;
    let listing : Listing = {
      id;
      seller = caller;
      title;
      description;
      price;
      currency;
      category;
      status = #available;
      photos;
      createdAt = now;
      updatedAt = now;
    };
    listings.add(id, listing);
    getUserListingIds(caller).add(id, ());
    updateProfileCurrency(caller, currency);
    listing;
  };

  public shared ({ caller }) func updateListing(
    id : Nat,
    title : Text,
    description : Text,
    price : Nat,
    currency : Text,
    category : Category,
    photos : [Media],
    status : ListingStatus,
  ) : async Listing {
    requireUser(caller);
    let existing = switch (listings.get(id)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (existing.seller != caller) {
      Runtime.trap("Not the seller of this listing");
    };
    // Validate status transitions: sold listings cannot be changed back
    if (existing.status == #sold and status != #sold) {
      Runtime.trap("Cannot change status of a sold listing");
    };
    if (title == "") {
      Runtime.trap("Title cannot be empty");
    };
    if (title.size() > 200) {
      Runtime.trap("Title must be 200 characters or fewer");
    };
    if (description.size() > 5000) {
      Runtime.trap("Description must be 5000 characters or fewer");
    };
    validateCurrency(currency);
    validatePhotos(photos);
    let updated : Listing = {
      id = existing.id;
      seller = existing.seller;
      title;
      description;
      price;
      currency;
      category;
      status;
      photos;
      createdAt = existing.createdAt;
      updatedAt = Time.now();
    };
    listings.add(id, updated);
    // Notify users who saved this listing about price or status changes
    let priceChanged = existing.price != price;
    let nowSold = status == #sold and existing.status != #sold;
    if (priceChanged or nowSold) {
      for ((user, savedIds) in userSavedListings.entries()) {
        if (savedIds.get(id) != null and user != caller) {
          if (nowSold) {
            addNotification(user, #savedListingSold, "\"" # title # "\" has been sold", ?id);
          } else if (priceChanged) {
            addNotification(user, #savedListingPriceChanged, "\"" # title # "\" price changed to " # currency # " " # price.toText(), ?id);
          };
        };
      };
    };
    updated;
  };

  public shared ({ caller }) func deleteListing(id : Nat) : async () {
    requireUser(caller);
    let existing = switch (listings.get(id)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (existing.seller != caller) {
      Runtime.trap("Not the seller of this listing");
    };
    listings.remove(id);
    getUserListingIds(caller).remove(id);
    cleanupListingReferences(id);
  };

  public query func getListing(id : Nat) : async ?Listing {
    listings.get(id);
  };

  public query ({ caller }) func getMyListings() : async [Listing] {
    requireAuth(caller);
    let ids = getUserListingIds(caller);
    let result = List.empty<Listing>();
    for ((id, _) in ids.entries()) {
      switch (listings.get(id)) {
        case (?l) { result.add(l) };
        case (null) {};
      };
    };
    result.toArray();
  };

  // Endpoints — Browse

  public query ({ caller }) func browseListings(
    keyword : ?Text,
    category : ?Category,
    minPrice : ?Nat,
    maxPrice : ?Nat,
    priceCurrency : ?Text,
    sort : ?SortOrder,
    offset : Nat,
    limit : Nat,
  ) : async [Listing] {
    let results = List.empty<Listing>();
    let callerBlockedSet = if (caller.isAnonymous()) { null } else {
      ?getUserBlockedSet(caller);
    };
    for ((_, listing) in listings.entries()) {
      if (listing.status == #available) {
        // Skip listings from banned users
        let sellerRole = accessControlState.userRoles.get(listing.seller);
        let sellerBanned = sellerRole == ?#guest;
        // Skip listings from users the caller has blocked
        let blockedSeller = switch (callerBlockedSet) {
          case (?blocked) { blocked.get(listing.seller) != null };
          case (null) { false };
        };
        if (sellerBanned or blockedSeller) {
          // skip
        } else {
          let matchesKeyword = switch (keyword) {
            case (null) { true };
            case (?kw) {
              if (kw == "") { true } else {
                let titleMatch = containsIgnoreCase(listing.title, kw);
                let descMatch = containsIgnoreCase(listing.description, kw);
                let sellerMatch = switch (userProfiles.get(listing.seller)) {
                  case (?p) {
                    containsIgnoreCase(p.username, kw) or containsIgnoreCase(p.name, kw);
                  };
                  case (null) { false };
                };
                titleMatch or descMatch or sellerMatch;
              };
            };
          };
          let matchesCategory = switch (category) {
            case (null) { true };
            case (?cat) { listing.category == cat };
          };
          let matchesMinPrice = switch (minPrice) {
            case (null) { true };
            case (?min) { listing.price >= min };
          };
          let matchesMaxPrice = switch (maxPrice) {
            case (null) { true };
            case (?max) { listing.price <= max };
          };
          // Currency constraint only applies when a price bound is set.
          // Clearing the price range drops the currency filter too.
          let hasPriceBound = minPrice != null or maxPrice != null;
          let matchesCurrency = if (not hasPriceBound) {
            true;
          } else {
            switch (priceCurrency) {
              case (null) { true };
              case (?pc) { listing.currency == pc };
            };
          };
          if (matchesKeyword and matchesCategory and matchesMinPrice and matchesMaxPrice and matchesCurrency) {
            results.add(listing);
          };
        };
      };
    };
    let sortFn : (Listing, Listing) -> { #less; #equal; #greater } = switch (sort) {
      case (null or ?#newest) {
        func(a, b) { Int.compare(b.createdAt, a.createdAt) };
      };
      case (?#priceAsc) {
        func(a, b) { Nat.compare(a.price, b.price) };
      };
      case (?#priceDesc) {
        func(a, b) { Nat.compare(b.price, a.price) };
      };
    };
    results.sortInPlace(sortFn);
    let arr = results.toArray();
    let start = if (offset >= arr.size()) { arr.size() } else { offset };
    let end = if (start + limit > arr.size()) { arr.size() } else {
      start + limit;
    };
    let page = List.empty<Listing>();
    var i = start;
    while (i < end) {
      page.add(arr[i]);
      i += 1;
    };
    page.toArray();
  };

  // Endpoints — Offers

  public shared ({ caller }) func makeOffer(listingId : Nat, amount : Nat) : async Offer {
    requireUser(caller);
    let listing = switch (listings.get(listingId)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (listing.status != #available) {
      Runtime.trap("Listing is not available");
    };
    if (listing.seller == caller) {
      Runtime.trap("Cannot make an offer on your own listing");
    };
    if (isBlocked(listing.seller, caller) or isBlocked(caller, listing.seller)) {
      Runtime.trap("Cannot make an offer — user is blocked");
    };
    if (amount == 0) {
      Runtime.trap("Offer amount must be greater than zero");
    };
    let offers = getListingOffers(listingId);
    for ((_, offer) in offers.entries()) {
      if (offer.buyer == caller and offer.status == #pending) {
        Runtime.trap("You already have an active offer on this listing");
      };
    };
    let id = nextOfferId;
    nextOfferId += 1;
    let offer : Offer = {
      id;
      listingId;
      buyer = caller;
      amount;
      counterAmount = null;
      status = #pending;
      createdAt = Time.now();
    };
    offers.add(id, offer);
    getUserOfferIndex(caller).add(id, listingId);
    let buyerName = switch (userProfiles.get(caller)) {
      case (?p) { p.name };
      case (null) { "Someone" };
    };
    addNotification(listing.seller, #newOffer, buyerName # " made an offer of " # listing.currency # " " # amount.toText() # " on \"" # listing.title # "\"", ?listingId);
    offer;
  };

  public shared ({ caller }) func respondToOffer(offerId : Nat, listingId : Nat, response : OfferResponse, counterAmount : ?Nat) : async Offer {
    requireUser(caller);
    let listing = switch (listings.get(listingId)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (listing.seller != caller) {
      Runtime.trap("Only the seller can respond to offers");
    };
    let offers = getListingOffers(listingId);
    let existing = switch (offers.get(offerId)) {
      case (?o) { o };
      case (null) { Runtime.trap("Offer not found") };
    };
    if (existing.status != #pending) {
      Runtime.trap("Can only respond to pending offers");
    };
    let updated : Offer = switch (response) {
      case (#accept) {
        if (listing.status != #available) {
          Runtime.trap("Listing is no longer available");
        };
        // Set listing to reserved
        let updatedListing : Listing = {
          id = listing.id;
          seller = listing.seller;
          title = listing.title;
          description = listing.description;
          price = listing.price;
          currency = listing.currency;
          category = listing.category;
          status = #reserved;
          photos = listing.photos;
          createdAt = listing.createdAt;
          updatedAt = Time.now();
        };
        listings.add(listing.id, updatedListing);
        // Auto-decline other pending offers on this listing
        for ((otherId, otherOffer) in offers.entries()) {
          if (otherId != offerId and (otherOffer.status == #pending or otherOffer.status == #accepted)) {
            offers.add(
              otherId,
              {
                id = otherOffer.id;
                listingId = otherOffer.listingId;
                buyer = otherOffer.buyer;
                amount = otherOffer.amount;
                counterAmount = otherOffer.counterAmount;
                status = #declined;
                createdAt = otherOffer.createdAt;
              },
            );
            addNotification(otherOffer.buyer, #offerDeclined, "Your offer on \"" # listing.title # "\" was declined (another offer was accepted)", ?listingId);
          };
        };
        {
          id = existing.id;
          listingId = existing.listingId;
          buyer = existing.buyer;
          amount = existing.amount;
          counterAmount = existing.counterAmount;
          status = #accepted;
          createdAt = existing.createdAt;
        };
      };
      case (#decline) {
        {
          id = existing.id;
          listingId = existing.listingId;
          buyer = existing.buyer;
          amount = existing.amount;
          counterAmount = existing.counterAmount;
          status = #declined;
          createdAt = existing.createdAt;
        };
      };
      case (#counter) {
        let cAmount = switch (counterAmount) {
          case (?a) { a };
          case (null) { Runtime.trap("Counter amount is required") };
        };
        if (cAmount == 0) {
          Runtime.trap("Counter amount must be greater than zero");
        };
        {
          id = existing.id;
          listingId = existing.listingId;
          buyer = existing.buyer;
          amount = existing.amount;
          counterAmount = ?cAmount;
          status = #countered;
          createdAt = existing.createdAt;
        };
      };
    };
    offers.add(offerId, updated);
    let sellerName = switch (userProfiles.get(caller)) {
      case (?p) { p.name };
      case (null) { "The seller" };
    };
    switch (response) {
      case (#accept) {
        addNotification(existing.buyer, #offerAccepted, sellerName # " accepted your offer on \"" # listing.title # "\"", ?listingId);
      };
      case (#decline) {
        addNotification(existing.buyer, #offerDeclined, sellerName # " declined your offer on \"" # listing.title # "\"", ?listingId);
      };
      case (#counter) {
        let cText = switch (counterAmount) {
          case (?a) { a.toText() };
          case (null) { "?" };
        };
        addNotification(existing.buyer, #offerCountered, sellerName # " countered your offer with " # listing.currency # " " # cText # " on \"" # listing.title # "\"", ?listingId);
      };
    };
    updated;
  };

  public query ({ caller }) func getOffersForListing(listingId : Nat) : async [Offer] {
    requireAuth(caller);
    let listing = switch (listings.get(listingId)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (listing.seller != caller) {
      Runtime.trap("Only the seller can view offers");
    };
    let offers = getListingOffers(listingId);
    let result = List.empty<Offer>();
    for ((_, offer) in offers.entries()) {
      result.add(offer);
    };
    // Sort by amount descending (highest offer first)
    result.sortInPlace(func(a, b) { Nat.compare(b.amount, a.amount) });
    result.toArray();
  };

  public query ({ caller }) func getMyOffers() : async [Offer] {
    requireAuth(caller);
    let result = List.empty<Offer>();
    let offerIndex = getUserOfferIndex(caller);
    for ((offerId, listingId) in offerIndex.entries()) {
      switch (listingOffers.get(listingId)) {
        case (?offers) {
          switch (offers.get(offerId)) {
            case (?offer) { result.add(offer) };
            case (null) {};
          };
        };
        case (null) {};
      };
    };
    // Sort by newest first
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  // Endpoints — Messaging

  public shared ({ caller }) func startConversation(listingId : Nat) : async Conversation {
    requireUser(caller);
    let listing = switch (listings.get(listingId)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (listing.seller == caller) {
      Runtime.trap("Cannot start a conversation on your own listing");
    };
    if (isBlocked(listing.seller, caller) or isBlocked(caller, listing.seller)) {
      Runtime.trap("Cannot message — user is blocked");
    };
    // Deduplicate: reuse existing conversation for same buyer+seller+listing
    let buyerConvIds = getUserConversationIds(caller);
    for ((convId, _) in buyerConvIds.entries()) {
      switch (conversations.get(convId)) {
        case (?conv) {
          if (conv.listingId == listingId and conv.seller == listing.seller) {
            return conv;
          };
        };
        case (null) {};
      };
    };
    let now = Time.now();
    let id = nextConversationId;
    nextConversationId += 1;
    let conv : Conversation = {
      id;
      listingId;
      buyer = caller;
      seller = listing.seller;
      lastMessageAt = now;
    };
    conversations.add(id, conv);
    getUserConversationIds(caller).add(id, ());
    getUserConversationIds(listing.seller).add(id, ());
    conv;
  };

  public shared ({ caller }) func sendMessage(conversationId : Nat, content : Text) : async Message {
    requireUser(caller);
    let conv = switch (conversations.get(conversationId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Conversation not found") };
    };
    if (conv.buyer != caller and conv.seller != caller) {
      Runtime.trap("Not a participant in this conversation");
    };
    let otherParty = if (conv.buyer == caller) { conv.seller } else {
      conv.buyer;
    };
    if (isBlocked(otherParty, caller) or isBlocked(caller, otherParty)) {
      Runtime.trap("Cannot send message — user is blocked");
    };
    if (content == "") {
      Runtime.trap("Message content cannot be empty");
    };
    if (content.size() > 2000) {
      Runtime.trap("Message must be 2000 characters or fewer");
    };
    let now = Time.now();
    let id = nextMessageId;
    nextMessageId += 1;
    let msg : Message = {
      id;
      conversationId;
      sender = caller;
      content;
      sentAt = now;
    };
    getConversationMessages(conversationId).add(msg);
    // Notify the other party
    let recipient = if (conv.buyer == caller) { conv.seller } else {
      conv.buyer;
    };
    let senderName = switch (userProfiles.get(caller)) {
      case (?p) { p.name };
      case (null) { "Someone" };
    };
    let listingTitle = switch (listings.get(conv.listingId)) {
      case (?l) { l.title };
      case (null) { "a listing" };
    };
    addNotification(recipient, #newMessage, senderName # " sent you a message about \"" # listingTitle # "\"", ?conv.id);
    // Update lastMessageAt
    let updatedConv : Conversation = {
      id = conv.id;
      listingId = conv.listingId;
      buyer = conv.buyer;
      seller = conv.seller;
      lastMessageAt = now;
    };
    conversations.add(conversationId, updatedConv);
    msg;
  };

  public query ({ caller }) func getConversations() : async [Conversation] {
    requireAuth(caller);
    let convIds = getUserConversationIds(caller);
    let result = List.empty<Conversation>();
    for ((convId, _) in convIds.entries()) {
      switch (conversations.get(convId)) {
        case (?conv) { result.add(conv) };
        case (null) {};
      };
    };
    // Sort by most recent message first
    result.sortInPlace(func(a, b) { Int.compare(b.lastMessageAt, a.lastMessageAt) });
    result.toArray();
  };

  public query ({ caller }) func getMessages(conversationId : Nat) : async [Message] {
    requireAuth(caller);
    let conv = switch (conversations.get(conversationId)) {
      case (?c) { c };
      case (null) { Runtime.trap("Conversation not found") };
    };
    if (conv.buyer != caller and conv.seller != caller) {
      Runtime.trap("Not a participant in this conversation");
    };
    let msgs = getConversationMessages(conversationId);
    // Sort by sent time ascending (chronological)
    msgs.sortInPlace(func(a, b) { Int.compare(a.sentAt, b.sentAt) });
    msgs.toArray();
  };

  // Endpoints — Saved Items

  public shared ({ caller }) func saveListing(listingId : Nat) : async () {
    requireUser(caller);
    switch (listings.get(listingId)) {
      case (?_) {};
      case (null) { Runtime.trap("Listing not found") };
    };
    getUserSavedIds(caller).add(listingId, ());
  };

  public shared ({ caller }) func unsaveListing(listingId : Nat) : async () {
    requireUser(caller);
    getUserSavedIds(caller).remove(listingId);
  };

  public query ({ caller }) func getSavedListings() : async [Listing] {
    requireAuth(caller);
    let savedIds = getUserSavedIds(caller);
    let result = List.empty<Listing>();
    for ((id, _) in savedIds.entries()) {
      switch (listings.get(id)) {
        case (?l) { result.add(l) };
        case (null) {};
      };
    };
    // Sort by newest first
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  // Endpoints — Notifications

  public query ({ caller }) func getNotifications() : async [Notification] {
    requireAuth(caller);
    let notifs = getUserNotifications(caller);
    let result = List.empty<Notification>();
    for ((_, n) in notifs.entries()) {
      result.add(n);
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public shared ({ caller }) func markNotificationRead(notifId : Nat) : async () {
    requireUser(caller);
    let notifs = getUserNotifications(caller);
    let n = switch (notifs.get(notifId)) {
      case (?n) { n };
      case (null) { Runtime.trap("Notification not found") };
    };
    notifs.add(
      notifId,
      {
        id = n.id;
        notifType = n.notifType;
        message = n.message;
        relatedId = n.relatedId;
        read = true;
        createdAt = n.createdAt;
      },
    );
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    requireUser(caller);
    let notifs = getUserNotifications(caller);
    for ((nid, n) in notifs.entries()) {
      if (not n.read) {
        notifs.add(
          nid,
          {
            id = n.id;
            notifType = n.notifType;
            message = n.message;
            relatedId = n.relatedId;
            read = true;
            createdAt = n.createdAt;
          },
        );
      };
    };
  };

  // Endpoints — Public Profiles & Ratings

  public query func getPublicProfile(user : Principal) : async ?PublicProfile {
    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) {
        let ratings = getSellerRatings(user);
        var totalRatings : Nat = 0;
        var sumStars : Nat = 0;
        for (r in ratings.values()) {
          if (not isRatingRemoved(user, r.listingId)) {
            sumStars += r.stars;
            totalRatings += 1;
          };
        };
        // Return avg as tenths of a star (0-50) to preserve one decimal of precision.
        // Frontend divides by 10 before display (e.g. 46 -> 4.6).
        let avgRating = if (totalRatings > 0) { (sumStars * 10) / totalRatings } else {
          0;
        };
        var activeListings : Nat = 0;
        let userListingIds = getUserListingIds(user);
        for ((id, _) in userListingIds.entries()) {
          switch (listings.get(id)) {
            case (?l) {
              if (l.status == #available) {
                activeListings += 1;
              };
            };
            case (null) {};
          };
        };
        ?{
          name = profile.name;
          username = profile.username;
          profilePhoto = profile.profilePhoto;
          joinDate = profile.joinDate;
          avgRating;
          totalRatings;
          activeListings;
        };
      };
    };
  };

  public shared ({ caller }) func rateSeller(listingId : Nat, stars : Nat, review : ?Text) : async () {
    requireUser(caller);
    if (stars < 1 or stars > 5) {
      Runtime.trap("Stars must be between 1 and 5");
    };
    switch (review) {
      case (?r) {
        if (r.size() > 1000) {
          Runtime.trap("Review must be 1000 characters or fewer");
        };
      };
      case (null) {};
    };
    let listing = switch (listings.get(listingId)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    if (listing.status != #sold) {
      Runtime.trap("Can only rate sellers of sold listings");
    };
    if (listing.seller == caller) {
      Runtime.trap("Cannot rate yourself");
    };
    // Check caller was the buyer (had an accepted offer)
    let offers = getListingOffers(listingId);
    var isBuyer = false;
    for ((_, offer) in offers.entries()) {
      if (offer.buyer == caller and offer.status == #accepted) {
        isBuyer := true;
      };
    };
    if (not isBuyer) {
      Runtime.trap("Only the buyer can rate the seller");
    };
    // Check not already rated
    let ratings = getSellerRatings(listing.seller);
    for (r in ratings.values()) {
      if (r.listingId == listingId and r.reviewer == caller) {
        Runtime.trap("You have already rated this seller for this listing");
      };
    };
    ratings.add({
      listingId;
      reviewer = caller;
      stars;
      review;
      createdAt = Time.now();
    });
  };

  // Endpoints — Reports

  public shared ({ caller }) func reportListing(listingId : Nat, reason : ReportReason, description : ?Text) : async () {
    requireUser(caller);
    switch (listings.get(listingId)) {
      case (?_) {};
      case (null) { Runtime.trap("Listing not found") };
    };
    switch (description) {
      case (?d) {
        if (d.size() > 1000) {
          Runtime.trap("Description must be 1000 characters or fewer");
        };
      };
      case (null) {};
    };
    if (hasPendingReport(caller, #listing(listingId))) {
      Runtime.trap("You already have a pending report for this listing");
    };
    let id = nextReportId;
    nextReportId += 1;
    reports.add(
      id,
      {
        id;
        reporter = caller;
        target = #listing(listingId);
        reason;
        description;
        status = #pending;
        createdAt = Time.now();
      },
    );
  };

  public shared ({ caller }) func reportUser(user : Principal, reason : ReportReason, description : ?Text) : async () {
    requireUser(caller);
    if (user == caller) {
      Runtime.trap("Cannot report yourself");
    };
    switch (description) {
      case (?d) {
        if (d.size() > 1000) {
          Runtime.trap("Description must be 1000 characters or fewer");
        };
      };
      case (null) {};
    };
    if (hasPendingReport(caller, #user(user))) {
      Runtime.trap("You already have a pending report for this user");
    };
    let id = nextReportId;
    nextReportId += 1;
    reports.add(
      id,
      {
        id;
        reporter = caller;
        target = #user(user);
        reason;
        description;
        status = #pending;
        createdAt = Time.now();
      },
    );
  };

  public shared ({ caller }) func reportRating(seller : Principal, listingId : Nat, reason : ReportReason, description : ?Text) : async () {
    requireUser(caller);
    switch (description) {
      case (?d) {
        if (d.size() > 1000) {
          Runtime.trap("Description must be 1000 characters or fewer");
        };
      };
      case (null) {};
    };
    let target = #rating({ seller; listingId });
    if (hasPendingReport(caller, target)) {
      Runtime.trap("You already have a pending report for this rating");
    };
    // Verify rating exists
    let ratings = getSellerRatings(seller);
    var found = false;
    for (r in ratings.values()) {
      if (r.listingId == listingId) {
        found := true;
      };
    };
    if (not found) {
      Runtime.trap("Rating not found");
    };
    let id = nextReportId;
    nextReportId += 1;
    reports.add(
      id,
      {
        id;
        reporter = caller;
        target;
        reason;
        description;
        status = #pending;
        createdAt = Time.now();
      },
    );
  };

  // Endpoints — Block

  public shared ({ caller }) func blockUser(user : Principal) : async () {
    requireUser(caller);
    if (user == caller) {
      Runtime.trap("Cannot block yourself");
    };
    getUserBlockedSet(caller).add(user, ());
  };

  public shared ({ caller }) func unblockUser(user : Principal) : async () {
    requireUser(caller);
    getUserBlockedSet(caller).remove(user);
  };

  public query ({ caller }) func getBlockedUsers() : async [Principal] {
    requireAuth(caller);
    let blocked = getUserBlockedSet(caller);
    let result = List.empty<Principal>();
    for ((principal, _) in blocked.entries()) {
      result.add(principal);
    };
    result.toArray();
  };

  // Endpoints — Admin

  public query ({ caller }) func getReports() : async [Report] {
    requireAuth(caller);
    requireAdmin(caller);
    let result = List.empty<Report>();
    for ((_, r) in reports.entries()) {
      if (r.status == #pending) {
        result.add(r);
      };
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public shared ({ caller }) func dismissReport(reportId : Nat) : async () {
    requireAuth(caller);
    requireAdmin(caller);
    let r = switch (reports.get(reportId)) {
      case (?r) { r };
      case (null) { Runtime.trap("Report not found") };
    };
    reports.add(
      reportId,
      {
        id = r.id;
        reporter = r.reporter;
        target = r.target;
        reason = r.reason;
        description = r.description;
        status = #dismissed;
        createdAt = r.createdAt;
      },
    );
  };

  public shared ({ caller }) func adminRemoveListing(listingId : Nat) : async () {
    requireAuth(caller);
    requireAdmin(caller);
    let existing = switch (listings.get(listingId)) {
      case (?l) { l };
      case (null) { Runtime.trap("Listing not found") };
    };
    listings.remove(listingId);
    getUserListingIds(existing.seller).remove(listingId);
    cleanupListingReferences(listingId);
    dismissReportsForTarget(#listing(listingId));
  };

  public shared ({ caller }) func adminRemoveRating(seller : Principal, listingId : Nat) : async () {
    requireAuth(caller);
    requireAdmin(caller);
    let key = ratingKey(seller, listingId);
    if (removedRatings.get(key) != null) {
      Runtime.trap("Rating already removed");
    };
    let ratings = getSellerRatings(seller);
    var found = false;
    for (r in ratings.values()) {
      if (r.listingId == listingId) {
        found := true;
      };
    };
    if (not found) {
      Runtime.trap("Rating not found");
    };
    removedRatings.add(key, ());
  };

  public shared ({ caller }) func banUser(user : Principal) : async () {
    requireAuth(caller);
    requireAdmin(caller);
    if (AccessControl.isAdmin(accessControlState, user)) {
      Runtime.trap("Cannot ban an admin");
    };
    AccessControl.assignRole(accessControlState, caller, user, #guest);
    dismissReportsForTarget(#user(user));
  };

  public shared ({ caller }) func unbanUser(user : Principal) : async () {
    requireAuth(caller);
    requireAdmin(caller);
    AccessControl.assignRole(accessControlState, caller, user, #user);
  };

  type UserInfo = {
    principal : Principal;
    name : Text;
    role : AccessControl.UserRole;
    joinDate : Int;
  };

  public query ({ caller }) func getUsers() : async [UserInfo] {
    requireAuth(caller);
    requireAdmin(caller);
    let result = List.empty<UserInfo>();
    for ((principal, role) in accessControlState.userRoles.entries()) {
      let name = switch (userProfiles.get(principal)) {
        case (?p) { p.name };
        case (null) { "" };
      };
      let joinDate = switch (userProfiles.get(principal)) {
        case (?p) { p.joinDate };
        case (null) { 0 };
      };
      result.add({ principal; name; role; joinDate });
    };
    result.toArray();
  };

  public query func getSellerListings(
    seller : Principal,
    status : ?ListingStatus,
    offset : Nat,
    limit : Nat,
  ) : async [Listing] {
    let ids = getUserListingIds(seller);
    let filtered = List.empty<Listing>();
    for ((id, _) in ids.entries()) {
      switch (listings.get(id)) {
        case (?l) {
          let matchesStatus = switch (status) {
            case (null) { true };
            case (?s) { l.status == s };
          };
          if (matchesStatus) {
            filtered.add(l);
          };
        };
        case (null) {};
      };
    };
    filtered.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    let arr = filtered.toArray();
    let start = if (offset >= arr.size()) { arr.size() } else { offset };
    let end = if (start + limit > arr.size()) { arr.size() } else {
      start + limit;
    };
    let result = List.empty<Listing>();
    var i = start;
    while (i < end) {
      result.add(arr[i]);
      i += 1;
    };
    result.toArray();
  };

  public query func getSellerReviews(seller : Principal) : async [PublicRating] {
    let ratings = getSellerRatings(seller);
    let result = List.empty<PublicRating>();
    for (r in ratings.values()) {
      if (not isRatingRemoved(seller, r.listingId)) {
        let reviewerUsername = switch (userProfiles.get(r.reviewer)) {
          case (?p) { p.username };
          case (null) { "anonymous" };
        };
        result.add({
          listingId = r.listingId;
          reviewer = r.reviewer;
          reviewerUsername;
          stars = r.stars;
          review = r.review;
          createdAt = r.createdAt;
        });
      };
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };

  public query ({ caller }) func getAllListings() : async [Listing] {
    requireAuth(caller);
    requireAdmin(caller);
    let result = List.empty<Listing>();
    for ((_, listing) in listings.entries()) {
      result.add(listing);
    };
    result.sortInPlace(func(a, b) { Int.compare(b.createdAt, a.createdAt) });
    result.toArray();
  };
};
