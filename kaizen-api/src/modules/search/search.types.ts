export type SearchResultType = "kaizen" | "user" | "department" | "category";

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  /** Character ranges (into `title`) that matched the query — frontend wraps these in `<mark>`.
   * Empty when the match came from a different field than `title` (still a valid result, just
   * nothing to highlight in the displayed title itself). */
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
