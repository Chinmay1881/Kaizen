"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Clock, FileText, Folder, Search, User, X } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { HighlightedText } from "@/features/search/components/highlighted-text";
import { getSearchablePages, type SearchablePage } from "@/features/search/constants/searchable-pages";
import { useRecentSearches } from "@/features/search/hooks/use-recent-searches";
import { useGlobalSearch } from "@/features/search/hooks/use-search";
import type { SearchResultItem } from "@/features/search/types/search";
import { cn } from "@/lib/utils";

export const OPEN_COMMAND_PALETTE_EVENT = "kaizen:open-command-palette";

interface FlatEntry {
  key: string;
  href: string;
  label: string;
  render: () => React.ReactNode;
}

const GROUP_ICON = {
  kaizen: FileText,
  user: User,
  department: Building2,
  category: Folder,
} as const;

const GROUP_LABEL = {
  kaizen: "Kaizens",
  user: "Users",
  department: "Departments",
  category: "Categories",
} as const;

/** Universal Search Bar / Command Palette (Milestone 11 Chunk 2 Part 4). No `cmdk`/Radix Dialog
 * dependency — the native `<dialog>` element gives a real modal (focus trap, Escape-to-close,
 * backdrop) for free, matching "reuse existing components, no new design language, no new
 * dependencies" better than adding a headless-UI package for one component. */
export function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { recent, addSearch, clear } = useRecentSearches(currentUser?.id);

  const [query, setQuery] = useState("");
  const [rawActiveIndex, setActiveIndex] = useState(0);
  const searchQuery = useGlobalSearch(query);

  const open = () => {
    setQuery("");
    setActiveIndex(0);
    dialogRef.current?.showModal();
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, open);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, open);
    };
  }, []);

  const pages = useMemo(() => getSearchablePages(currentUser?.role), [currentUser?.role]);
  const matchingPages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return pages.filter((page) => `${page.label} ${page.keywords}`.toLowerCase().includes(q));
  }, [pages, query]);

  function handleSelect(href: string) {
    if (query.trim()) addSearch(query);
    close();
    router.push(href);
  }

  const groups: Array<{ type: keyof typeof GROUP_LABEL; items: SearchResultItem[] }> = query.trim()
    ? [
        { type: "kaizen", items: searchQuery.data?.kaizens ?? [] },
        { type: "user", items: searchQuery.data?.users ?? [] },
        { type: "department", items: searchQuery.data?.departments ?? [] },
        { type: "category", items: searchQuery.data?.categories ?? [] },
      ]
    : [];

  const flatEntries: FlatEntry[] = useMemo(() => {
    const entries: FlatEntry[] = [];
    if (!query.trim()) {
      for (const term of recent) {
        entries.push({
          key: `recent-${term}`,
          href: "",
          label: term,
          render: () => (
            <>
              <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">{term}</span>
            </>
          ),
        });
      }
    }
    for (const page of matchingPages) {
      entries.push({
        key: `page-${page.href}`,
        href: page.href,
        label: page.label,
        render: () => (
          <>
            <page.icon className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="flex-1 truncate text-left">{page.label}</span>
            <span className="text-muted-foreground text-xs">Page</span>
          </>
        ),
      });
    }
    for (const group of groups) {
      for (const item of group.items) {
        const Icon = GROUP_ICON[item.type];
        entries.push({
          key: `${item.type}-${item.id}`,
          href: item.href,
          label: item.title,
          render: () => (
            <>
              <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate">
                  <HighlightedText text={item.title} matches={item.titleMatches} />
                </p>
                {item.subtitle ? <p className="text-muted-foreground truncate text-xs">{item.subtitle}</p> : null}
              </div>
            </>
          ),
        });
      }
    }
    return entries;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, recent, matchingPages, searchQuery.data]);

  // Clamped on read rather than reset via an effect keyed on `flatEntries.length` — avoids an
  // extra render-then-sync cascade every time the result set changes size while typing.
  const activeIndex = Math.min(rawActiveIndex, Math.max(flatEntries.length - 1, 0));

  function handleKeyNav(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatEntries.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = flatEntries[activeIndex];
      if (!entry) return;
      if (entry.href) handleSelect(entry.href);
      else setQuery(entry.label);
    }
  }

  const hasQuery = query.trim().length > 0;
  const showEmptyResults =
    hasQuery && !searchQuery.isLoading && matchingPages.length === 0 && groups.every((g) => g.items.length === 0);

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent p-0 backdrop:bg-black/50 open:animate-in open:fade-in"
      onClose={() => setQuery("")}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div className="bg-popover text-popover-foreground flex h-[70vh] max-h-[560px] w-[min(92vw,640px)] flex-col overflow-hidden rounded-xl border shadow-2xl">
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyNav}
            placeholder="Search Kaizens, people, departments, categories, pages…"
            className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Global search"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Close search"
            className="text-muted-foreground hover:text-foreground rounded p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!hasQuery && recent.length > 0 ? (
            <div className="mb-2">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-muted-foreground text-xs font-medium">Recent Searches</p>
                <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground text-xs">
                  Clear
                </button>
              </div>
              {recent.map((term, index) => (
                <ResultButton key={`recent-${term}`} active={index === activeIndex} onClick={() => setQuery(term)}>
                  <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate text-left">{term}</span>
                </ResultButton>
              ))}
            </div>
          ) : null}

          {!hasQuery && recent.length === 0 ? (
            <EmptyState icon={Search} title="Search anything" description="Kaizens, people, departments, categories, or jump to a page." />
          ) : null}

          {matchingPages.length > 0 ? (
            <ResultGroup label="Pages">
              {matchingPages.map((page) => {
                const index = flatEntries.findIndex((entry) => entry.key === `page-${page.href}`);
                return (
                  <ResultButton key={page.href} active={index === activeIndex} onClick={() => handleSelect(page.href)}>
                    <PageRow page={page} />
                  </ResultButton>
                );
              })}
            </ResultGroup>
          ) : null}

          {hasQuery && searchQuery.isLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {[...Array(4)].map((_, index) => (
                <LoadingSkeleton key={index} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : null}

          {groups.map((group) =>
            group.items.length > 0 ? (
              <ResultGroup key={group.type} label={GROUP_LABEL[group.type]}>
                {group.items.map((item) => {
                  const index = flatEntries.findIndex((entry) => entry.key === `${item.type}-${item.id}`);
                  const Icon = GROUP_ICON[item.type];
                  return (
                    <ResultButton key={item.id} active={index === activeIndex} onClick={() => handleSelect(item.href)}>
                      <Icon className="text-muted-foreground h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate">
                          <HighlightedText text={item.title} matches={item.titleMatches} />
                        </p>
                        {item.subtitle ? (
                          <p className="text-muted-foreground truncate text-xs">{item.subtitle}</p>
                        ) : null}
                      </div>
                    </ResultButton>
                  );
                })}
              </ResultGroup>
            ) : null,
          )}

          {showEmptyResults ? (
            <EmptyState icon={Search} title="No results" description={`Nothing matched "${query}".`} />
          ) : null}
        </div>

        <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
          <span>↑↓ to navigate · Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </dialog>
  );
}

function PageRow({ page }: { page: SearchablePage }) {
  return (
    <>
      <page.icon className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-left">{page.label}</span>
      <span className="text-muted-foreground text-xs">Page</span>
    </>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-muted-foreground px-2 py-1 text-xs font-medium">{label}</p>
      {children}
    </div>
  );
}

function ResultButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm transition-colors",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
      )}
    >
      {children}
    </button>
  );
}
