export type SearchResultType = "kaizen" | "user" | "department" | "category";

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  titleMatches: Array<[number, number]>;
  subtitle: string | null;
  href: string;
}

export interface GroupedSearchResults {
  kaizens: SearchResultItem[];
  users: SearchResultItem[];
  departments: SearchResultItem[];
  categories: SearchResultItem[];
}
