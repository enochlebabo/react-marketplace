import {
  Armchair,
  BookOpen,
  Car,
  Dumbbell,
  Gamepad2,
  House,
  type LucideIcon,
  Package,
  Shirt,
  Smartphone,
} from "lucide-react";
import { Category, ListingStatus, OfferStatus, ReportReason } from "../backend";

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.electronics]: "Electronics",
  [Category.furniture]: "Furniture",
  [Category.fashion]: "Fashion",
  [Category.sports]: "Sports",
  [Category.books]: "Books",
  [Category.vehicles]: "Vehicles",
  [Category.home]: "Home",
  [Category.toys]: "Toys",
  [Category.other]: "Other",
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  [Category.electronics]: Smartphone,
  [Category.furniture]: Armchair,
  [Category.fashion]: Shirt,
  [Category.sports]: Dumbbell,
  [Category.books]: BookOpen,
  [Category.vehicles]: Car,
  [Category.home]: House,
  [Category.toys]: Gamepad2,
  [Category.other]: Package,
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  [ListingStatus.available]: "Available",
  [ListingStatus.reserved]: "Reserved",
  [ListingStatus.sold]: "Sold",
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  [OfferStatus.pending]: "Pending",
  [OfferStatus.accepted]: "Accepted",
  [OfferStatus.declined]: "Declined",
  [OfferStatus.countered]: "Countered",
};

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  [ReportReason.spam]: "Spam",
  [ReportReason.offensive]: "Offensive content",
  [ReportReason.scam]: "Scam or fraud",
  [ReportReason.prohibited]: "Prohibited item",
  [ReportReason.other]: "Other",
};

export function getOfferStatusVariant(
  status: OfferStatus,
): "default" | "secondary" | "outline" {
  if (status === OfferStatus.pending) return "default";
  if (status === OfferStatus.accepted) return "secondary";
  return "outline";
}

export const RADIUS_OPTIONS = [
  { value: "1", label: "1 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "anywhere", label: "Anywhere" },
] as const;

// ISO 4217 currency codes. The `symbol` field is currently unused in the UI
// (formatPrice uses Intl.NumberFormat which provides localized symbols), but
// kept on the shape in case components want a short glyph later. Backend
// accepts any valid 3-letter uppercase code, so extending this list is
// purely additive with no backend change needed.
export const CURRENCIES = [
  { code: "AED", label: "AED — UAE Dirham", symbol: "AED" },
  { code: "AFN", label: "AFN — Afghan Afghani", symbol: "؋" },
  { code: "ALL", label: "ALL — Albanian Lek", symbol: "L" },
  { code: "AMD", label: "AMD — Armenian Dram", symbol: "֏" },
  { code: "ANG", label: "ANG — Netherlands Antillean Guilder", symbol: "ƒ" },
  { code: "AOA", label: "AOA — Angolan Kwanza", symbol: "Kz" },
  { code: "ARS", label: "ARS — Argentine Peso", symbol: "$" },
  { code: "AUD", label: "AUD — Australian Dollar", symbol: "A$" },
  { code: "AWG", label: "AWG — Aruban Florin", symbol: "ƒ" },
  { code: "AZN", label: "AZN — Azerbaijani Manat", symbol: "₼" },
  {
    code: "BAM",
    label: "BAM — Bosnia-Herzegovina Convertible Mark",
    symbol: "KM",
  },
  { code: "BBD", label: "BBD — Barbadian Dollar", symbol: "$" },
  { code: "BDT", label: "BDT — Bangladeshi Taka", symbol: "৳" },
  { code: "BGN", label: "BGN — Bulgarian Lev", symbol: "лв" },
  { code: "BHD", label: "BHD — Bahraini Dinar", symbol: "BD" },
  { code: "BIF", label: "BIF — Burundian Franc", symbol: "FBu" },
  { code: "BMD", label: "BMD — Bermudan Dollar", symbol: "$" },
  { code: "BND", label: "BND — Brunei Dollar", symbol: "$" },
  { code: "BOB", label: "BOB — Bolivian Boliviano", symbol: "Bs" },
  { code: "BRL", label: "BRL — Brazilian Real", symbol: "R$" },
  { code: "BSD", label: "BSD — Bahamian Dollar", symbol: "$" },
  { code: "BTN", label: "BTN — Bhutanese Ngultrum", symbol: "Nu" },
  { code: "BWP", label: "BWP — Botswanan Pula", symbol: "P" },
  { code: "BYN", label: "BYN — Belarusian Ruble", symbol: "Br" },
  { code: "BZD", label: "BZD — Belize Dollar", symbol: "BZ$" },
  { code: "CAD", label: "CAD — Canadian Dollar", symbol: "C$" },
  { code: "CDF", label: "CDF — Congolese Franc", symbol: "FC" },
  { code: "CHF", label: "CHF — Swiss Franc", symbol: "CHF" },
  { code: "CLP", label: "CLP — Chilean Peso", symbol: "$" },
  { code: "CNY", label: "CNY — Chinese Yuan", symbol: "¥" },
  { code: "COP", label: "COP — Colombian Peso", symbol: "$" },
  { code: "CRC", label: "CRC — Costa Rican Colón", symbol: "₡" },
  { code: "CUP", label: "CUP — Cuban Peso", symbol: "$" },
  { code: "CVE", label: "CVE — Cape Verdean Escudo", symbol: "$" },
  { code: "CZK", label: "CZK — Czech Koruna", symbol: "Kč" },
  { code: "DJF", label: "DJF — Djiboutian Franc", symbol: "Fdj" },
  { code: "DKK", label: "DKK — Danish Krone", symbol: "kr" },
  { code: "DOP", label: "DOP — Dominican Peso", symbol: "RD$" },
  { code: "DZD", label: "DZD — Algerian Dinar", symbol: "DA" },
  { code: "EGP", label: "EGP — Egyptian Pound", symbol: "E£" },
  { code: "ERN", label: "ERN — Eritrean Nakfa", symbol: "Nfk" },
  { code: "ETB", label: "ETB — Ethiopian Birr", symbol: "Br" },
  { code: "EUR", label: "EUR — Euro", symbol: "€" },
  { code: "FJD", label: "FJD — Fijian Dollar", symbol: "$" },
  { code: "FKP", label: "FKP — Falkland Islands Pound", symbol: "£" },
  { code: "GBP", label: "GBP — British Pound", symbol: "£" },
  { code: "GEL", label: "GEL — Georgian Lari", symbol: "₾" },
  { code: "GHS", label: "GHS — Ghanaian Cedi", symbol: "GH₵" },
  { code: "GIP", label: "GIP — Gibraltar Pound", symbol: "£" },
  { code: "GMD", label: "GMD — Gambian Dalasi", symbol: "D" },
  { code: "GNF", label: "GNF — Guinean Franc", symbol: "FG" },
  { code: "GTQ", label: "GTQ — Guatemalan Quetzal", symbol: "Q" },
  { code: "GYD", label: "GYD — Guyanaese Dollar", symbol: "$" },
  { code: "HKD", label: "HKD — Hong Kong Dollar", symbol: "HK$" },
  { code: "HNL", label: "HNL — Honduran Lempira", symbol: "L" },
  { code: "HTG", label: "HTG — Haitian Gourde", symbol: "G" },
  { code: "HUF", label: "HUF — Hungarian Forint", symbol: "Ft" },
  { code: "IDR", label: "IDR — Indonesian Rupiah", symbol: "Rp" },
  { code: "ILS", label: "ILS — Israeli New Shekel", symbol: "₪" },
  { code: "INR", label: "INR — Indian Rupee", symbol: "₹" },
  { code: "IQD", label: "IQD — Iraqi Dinar", symbol: "IQD" },
  { code: "ISK", label: "ISK — Icelandic Króna", symbol: "kr" },
  { code: "JMD", label: "JMD — Jamaican Dollar", symbol: "J$" },
  { code: "JOD", label: "JOD — Jordanian Dinar", symbol: "JD" },
  { code: "JPY", label: "JPY — Japanese Yen", symbol: "¥" },
  { code: "KES", label: "KES — Kenyan Shilling", symbol: "KSh" },
  { code: "KGS", label: "KGS — Kyrgystani Som", symbol: "с" },
  { code: "KHR", label: "KHR — Cambodian Riel", symbol: "៛" },
  { code: "KMF", label: "KMF — Comorian Franc", symbol: "CF" },
  { code: "KRW", label: "KRW — South Korean Won", symbol: "₩" },
  { code: "KWD", label: "KWD — Kuwaiti Dinar", symbol: "KD" },
  { code: "KYD", label: "KYD — Cayman Islands Dollar", symbol: "$" },
  { code: "KZT", label: "KZT — Kazakhstani Tenge", symbol: "₸" },
  { code: "LAK", label: "LAK — Laotian Kip", symbol: "₭" },
  { code: "LBP", label: "LBP — Lebanese Pound", symbol: "L£" },
  { code: "LKR", label: "LKR — Sri Lankan Rupee", symbol: "Rs" },
  { code: "LRD", label: "LRD — Liberian Dollar", symbol: "$" },
  { code: "LSL", label: "LSL — Lesotho Loti", symbol: "L" },
  { code: "MAD", label: "MAD — Moroccan Dirham", symbol: "DH" },
  { code: "MDL", label: "MDL — Moldovan Leu", symbol: "L" },
  { code: "MGA", label: "MGA — Malagasy Ariary", symbol: "Ar" },
  { code: "MKD", label: "MKD — Macedonian Denar", symbol: "ден" },
  { code: "MMK", label: "MMK — Myanma Kyat", symbol: "K" },
  { code: "MNT", label: "MNT — Mongolian Tugrik", symbol: "₮" },
  { code: "MOP", label: "MOP — Macanese Pataca", symbol: "MOP$" },
  { code: "MRU", label: "MRU — Mauritanian Ouguiya", symbol: "UM" },
  { code: "MUR", label: "MUR — Mauritian Rupee", symbol: "Rs" },
  { code: "MVR", label: "MVR — Maldivian Rufiyaa", symbol: "Rf" },
  { code: "MWK", label: "MWK — Malawian Kwacha", symbol: "MK" },
  { code: "MXN", label: "MXN — Mexican Peso", symbol: "M$" },
  { code: "MYR", label: "MYR — Malaysian Ringgit", symbol: "RM" },
  { code: "MZN", label: "MZN — Mozambican Metical", symbol: "MT" },
  { code: "NAD", label: "NAD — Namibian Dollar", symbol: "$" },
  { code: "NGN", label: "NGN — Nigerian Naira", symbol: "₦" },
  { code: "NIO", label: "NIO — Nicaraguan Córdoba", symbol: "C$" },
  { code: "NOK", label: "NOK — Norwegian Krone", symbol: "kr" },
  { code: "NPR", label: "NPR — Nepalese Rupee", symbol: "Rs" },
  { code: "NZD", label: "NZD — New Zealand Dollar", symbol: "NZ$" },
  { code: "OMR", label: "OMR — Omani Rial", symbol: "OMR" },
  { code: "PAB", label: "PAB — Panamanian Balboa", symbol: "B/." },
  { code: "PEN", label: "PEN — Peruvian Sol", symbol: "S/" },
  { code: "PGK", label: "PGK — Papua New Guinean Kina", symbol: "K" },
  { code: "PHP", label: "PHP — Philippine Peso", symbol: "₱" },
  { code: "PKR", label: "PKR — Pakistani Rupee", symbol: "Rs" },
  { code: "PLN", label: "PLN — Polish Zloty", symbol: "zł" },
  { code: "PYG", label: "PYG — Paraguayan Guarani", symbol: "₲" },
  { code: "QAR", label: "QAR — Qatari Rial", symbol: "QR" },
  { code: "RON", label: "RON — Romanian Leu", symbol: "lei" },
  { code: "RSD", label: "RSD — Serbian Dinar", symbol: "дин" },
  { code: "RUB", label: "RUB — Russian Ruble", symbol: "₽" },
  { code: "RWF", label: "RWF — Rwandan Franc", symbol: "RF" },
  { code: "SAR", label: "SAR — Saudi Riyal", symbol: "SR" },
  { code: "SBD", label: "SBD — Solomon Islands Dollar", symbol: "$" },
  { code: "SCR", label: "SCR — Seychellois Rupee", symbol: "Rs" },
  { code: "SEK", label: "SEK — Swedish Krona", symbol: "kr" },
  { code: "SGD", label: "SGD — Singapore Dollar", symbol: "S$" },
  { code: "SHP", label: "SHP — Saint Helena Pound", symbol: "£" },
  { code: "SLE", label: "SLE — Sierra Leonean Leone", symbol: "Le" },
  { code: "SOS", label: "SOS — Somali Shilling", symbol: "Sh" },
  { code: "SRD", label: "SRD — Surinamese Dollar", symbol: "$" },
  { code: "SSP", label: "SSP — South Sudanese Pound", symbol: "£" },
  { code: "STN", label: "STN — São Tomé & Príncipe Dobra", symbol: "Db" },
  { code: "SVC", label: "SVC — Salvadoran Colón", symbol: "₡" },
  { code: "SZL", label: "SZL — Swazi Lilangeni", symbol: "L" },
  { code: "THB", label: "THB — Thai Baht", symbol: "฿" },
  { code: "TJS", label: "TJS — Tajikistani Somoni", symbol: "SM" },
  { code: "TMT", label: "TMT — Turkmenistani Manat", symbol: "T" },
  { code: "TND", label: "TND — Tunisian Dinar", symbol: "DT" },
  { code: "TOP", label: "TOP — Tongan Paʻanga", symbol: "T$" },
  { code: "TRY", label: "TRY — Turkish Lira", symbol: "₺" },
  { code: "TTD", label: "TTD — Trinidad & Tobago Dollar", symbol: "TT$" },
  { code: "TWD", label: "TWD — New Taiwan Dollar", symbol: "NT$" },
  { code: "TZS", label: "TZS — Tanzanian Shilling", symbol: "TSh" },
  { code: "UAH", label: "UAH — Ukrainian Hryvnia", symbol: "₴" },
  { code: "UGX", label: "UGX — Ugandan Shilling", symbol: "USh" },
  { code: "USD", label: "USD — US Dollar", symbol: "$" },
  { code: "UYU", label: "UYU — Uruguayan Peso", symbol: "$U" },
  { code: "UZS", label: "UZS — Uzbekistani Som", symbol: "сум" },
  { code: "VES", label: "VES — Venezuelan Bolívar", symbol: "Bs" },
  { code: "VND", label: "VND — Vietnamese Dong", symbol: "₫" },
  { code: "VUV", label: "VUV — Vanuatu Vatu", symbol: "VT" },
  { code: "WST", label: "WST — Samoan Tala", symbol: "T" },
  { code: "XAF", label: "XAF — Central African CFA Franc", symbol: "FCFA" },
  { code: "XCD", label: "XCD — East Caribbean Dollar", symbol: "$" },
  { code: "XOF", label: "XOF — West African CFA Franc", symbol: "CFA" },
  { code: "XPF", label: "XPF — CFP Franc", symbol: "₣" },
  { code: "YER", label: "YER — Yemeni Rial", symbol: "YR" },
  { code: "ZAR", label: "ZAR — South African Rand", symbol: "R" },
  { code: "ZMW", label: "ZMW — Zambian Kwacha", symbol: "ZK" },
] as const;

export const DEFAULT_CURRENCY = "USD";

export const USERNAME_PATTERN = /^[a-z0-9_-]{3,30}$/;

// Returns a user-facing error message, or null if the username is well-formed.
// Uniqueness is checked separately via isUsernameAvailable.
export function validateUsernameFormat(username: string): string | null {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length === 0) return "Username is required";
  if (trimmed.length < 3) return "Username must be at least 3 characters";
  if (trimmed.length > 30) return "Username must be 30 characters or fewer";
  if (!USERNAME_PATTERN.test(trimmed)) {
    return "Username can only contain lowercase letters, digits, underscore, or hyphen";
  }
  return null;
}
