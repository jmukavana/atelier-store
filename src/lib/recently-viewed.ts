const STORAGE_KEY = "atelier-recently-viewed";
const MAX_ITEMS = 8;

export type RecentlyViewedItem = {
  slug: string;
  name: string;
  price: number;
  mark: string;
  category: string;
};

export function recordView(item: RecentlyViewedItem) {
  try {
    const current = readAll();
    const next = [item, ...current.filter((i) => i.slug !== item.slug)].slice(
      0,
      MAX_ITEMS
    );
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — recently-viewed is a nice-to-have, not
    // worth surfacing an error for.
  }
}

export function readAll(): RecentlyViewedItem[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as RecentlyViewedItem[]) : [];
  } catch {
    return [];
  }
}
