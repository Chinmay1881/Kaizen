import { Fragment } from "react";

interface HighlightedTextProps {
  text: string;
  matches: Array<[number, number]>;
}

/** Wraps matched character ranges (from the backend's Fuse.js match indices) in `<mark>` — Part 7
 * (Search Highlighting). Falls back to plain text when there's nothing to highlight (a result
 * that matched on a field other than the displayed title). */
export function HighlightedText({ text, matches }: HighlightedTextProps) {
  if (matches.length === 0) return <>{text}</>;

  const sorted = [...matches].sort((a, b) => a[0] - b[0]);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(([start, end], index) => {
    const safeStart = Math.max(start, cursor);
    const safeEnd = Math.min(end + 1, text.length);
    if (safeStart > cursor) parts.push(<Fragment key={`t-${index}`}>{text.slice(cursor, safeStart)}</Fragment>);
    if (safeEnd > safeStart) {
      parts.push(
        <mark key={`m-${index}`} className="bg-warning/40 text-foreground rounded-sm px-0.5">
          {text.slice(safeStart, safeEnd)}
        </mark>,
      );
    }
    cursor = Math.max(cursor, safeEnd);
  });
  if (cursor < text.length) parts.push(<Fragment key="t-end">{text.slice(cursor)}</Fragment>);

  return <>{parts}</>;
}
