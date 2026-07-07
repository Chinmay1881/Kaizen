export function formatKaizenNumber(year: number, sequence: number): string {
  return `KZN-${year}-${String(sequence).padStart(5, "0")}`;
}
