export function formatKaizenNumber(employeeCode: string, year: number, sequence: number): string {
  return `KZN-${employeeCode}-${year}-${String(sequence).padStart(5, "0")}`;
}
