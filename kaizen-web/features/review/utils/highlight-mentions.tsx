import { Fragment } from "react";

const MENTION_PATTERN = /(@[a-zA-Z][\w.-]*)/g;

/** Styles `@name` tokens distinctly — "mentions ready" per the brief, without a full
 * mention-autocomplete picker (that would need a department-member lookup UI this milestone
 * doesn't call for). Plain visual affordance over already-typed text, nothing more. */
export function highlightMentions(text: string): React.ReactNode {
  const parts = text.split(MENTION_PATTERN);
  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, index) =>
        // `.split()` with a capturing group interleaves [text, match, text, match, ...] — the
        // captured mentions always land at odd indices. Re-testing `part` against the same `/g`
        // regex here would be a classic stateful-lastIndex bug (alternating false positives).
        index % 2 === 1 ? (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
