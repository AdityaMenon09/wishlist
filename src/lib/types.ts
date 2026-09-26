export type Spec = { label: string; value: string };

export type ItemStatus = "wishlist" | "bought" | "archived";

export type PriceSource = "server" | "bookmarklet" | "manual" | "share";

export type CompareOffer = {
  store: string;
  storeName: string;
  title: string;
  price: number;
  link: string;
};

export type CompareResult = {
  query: string;
  offers: CompareOffer[];
  skipped: number; // results from stores outside the trusted list
};

export type Item = {
  id: number;
  url: string;
  store: string;
  title: string;
  brand: string | null;
  image: string | null;
  description: string | null;
  specs: Spec[];
  features: string[];
  category: string;
  currentPrice: number | null;
  mrp: number | null;
  targetPrice: number | null;
  status: ItemStatus;
  notes: string | null;
  fetchError: string | null;
  lastCheckedAt: string | null;
  compare: CompareResult | null;
  comparedAt: string | null;
  boughtPrice: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Item plus a little price-history summary, for lists and cards. */
export type ItemSummary = Item & {
  lowPrice: number | null;
  prevPrice: number | null;
  pointCount: number;
  spark: number[];
};

export type PricePoint = {
  id: number;
  itemId: number;
  price: number;
  source: PriceSource;
  recordedAt: string;
};

export type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
  spentOn: string; // YYYY-MM-DD
  note: string | null;
  itemId: number | null;
  createdAt: string;
};

/** What a product page parser can extract. Every field is optional except title. */
export type ProductData = {
  title: string;
  brand?: string;
  image?: string;
  price?: number;
  mrp?: number;
  description?: string;
  specs: Spec[];
  features: string[];
  breadcrumbs: string[];
  available?: boolean;
};
