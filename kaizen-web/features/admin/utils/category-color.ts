const TOKEN_ROTATION = [
  { bg: "bg-primary/10", text: "text-primary" },
  { bg: "bg-info/15", text: "text-info" },
  { bg: "bg-success/15", text: "text-success" },
  { bg: "bg-achievement/20", text: "text-achievement-foreground" },
  { bg: "bg-rewards/15", text: "text-rewards" },
  { bg: "bg-implementation/15", text: "text-implementation" },
  { bg: "bg-business-impact/15", text: "text-business-impact" },
  { bg: "bg-warning/20", text: "text-warning-foreground" },
];

/**
 * Categories have no `color` field on the backend — this deterministically assigns one of the
 * app's existing semantic/domain tokens per category so the gallery has visual variety without
 * inventing new colors or fabricating data (same category always gets the same tone).
 */
export function categoryTone(id: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return TOKEN_ROTATION[hash % TOKEN_ROTATION.length];
}
