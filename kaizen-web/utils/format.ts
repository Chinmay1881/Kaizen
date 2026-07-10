export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** "Chinmay Patel" -> "CP"; falls back to the first letter if only one name part exists. */
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName.trim().charAt(0);
  const last = lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}
