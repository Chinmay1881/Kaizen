export function formatEmployeeCode(sequence: number): string {
  return `EMP${String(sequence).padStart(3, "0")}`;
}
