export type CategoryId =
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "sports"
  | "books"
  | "food"
  | "groceries"
  | "transport"
  | "travel"
  | "bills"
  | "health"
  | "education"
  | "entertainment"
  | "subscriptions"
  | "gifts"
  | "other";

type Category = {
  id: CategoryId;
  label: string;
  /** Can a wishlist product belong here? (expenses can use any category) */
  product: boolean;
  /** Which sale calendar applies when predicting prices. */
  saleGroup: "electronics" | "fashion" | "general";
};

export const CATEGORIES: Category[] = [
  { id: "electronics", label: "Electronics", product: true, saleGroup: "electronics" },
  { id: "fashion", label: "Fashion", product: true, saleGroup: "fashion" },
  { id: "home", label: "Home & kitchen", product: true, saleGroup: "general" },
  { id: "beauty", label: "Beauty & care", product: true, saleGroup: "general" },
  { id: "sports", label: "Sports & fitness", product: true, saleGroup: "fashion" },
  { id: "books", label: "Books", product: true, saleGroup: "general" },
  { id: "food", label: "Food & dining", product: false, saleGroup: "general" },
  { id: "groceries", label: "Groceries", product: false, saleGroup: "general" },
  { id: "transport", label: "Transport", product: false, saleGroup: "general" },
  { id: "travel", label: "Travel", product: false, saleGroup: "general" },
  { id: "bills", label: "Bills & utilities", product: false, saleGroup: "general" },
  { id: "health", label: "Health", product: false, saleGroup: "general" },
  { id: "education", label: "Education", product: false, saleGroup: "general" },
  { id: "entertainment", label: "Entertainment", product: false, saleGroup: "general" },
  { id: "subscriptions", label: "Subscriptions", product: false, saleGroup: "general" },
  { id: "gifts", label: "Gifts", product: false, saleGroup: "general" },
  { id: "other", label: "Other", product: true, saleGroup: "general" },
];

export const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c.product);

export function categoryOf(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

const KEYWORDS: [CategoryId, RegExp][] = [
  [
    "electronics",
    /\b(mouse|keyboard|laptop|notebook|phone|smartphone|iphone|galaxy|pixel|tablet|ipad|headphone|headset|earbud|earphone|airpods|tws|speaker|soundbar|monitor|tv|television|ssd|hdd|hard drive|pendrive|charger|power ?bank|cable|router|camera|lens|console|playstation|xbox|controller|smartwatch|smart watch|gpu|graphics card|processor|motherboard|ram|printer|webcam|microphone|electronics|computers?)\b/i,
  ],
  [
    "fashion",
    /\b(shirt|t-shirt|tshirt|tee|polo|jeans|trouser|pant|chino|shorts|kurta|kurti|saree|dress|top|jacket|hoodie|sweatshirt|sweater|blazer|shoe|shoes|sneaker|sneakers|sandal|slipper|flip flop|boot|loafer|socks|belt|wallet|bag|backpack|cap|watch|sunglasses|clothing|apparel|footwear|fashion)\b/i,
  ],
  ["sports", /\b(yoga|dumbbell|treadmill|cycle|bicycle|football|cricket|badminton|racket|gym|fitness|sports)\b/i],
  ["beauty", /\b(serum|moisturi[sz]er|sunscreen|shampoo|conditioner|trimmer|perfume|deodorant|lipstick|skincare|beauty|grooming)\b/i],
  ["home", /\b(mattress|pillow|bedsheet|curtain|chair|table|sofa|lamp|kitchen|cookware|pan|kettle|mixer|grinder|bottle|furniture|home)\b/i],
  ["books", /\b(book|paperback|hardcover|novel|kindle edition)\b/i],
];

/** Guess a product category from its breadcrumbs first, then its title. */
export function guessCategory(title: string, breadcrumbs: string[] = []): CategoryId {
  for (const text of [breadcrumbs.join(" "), title]) {
    if (!text) continue;
    for (const [id, re] of KEYWORDS) if (re.test(text)) return id;
  }
  return "other";
}
