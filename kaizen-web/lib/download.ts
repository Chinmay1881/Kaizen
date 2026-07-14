/** Client-side "save this Blob as a file" — the create-object-URL/anchor-click/revoke tail that
 * every local export (Admin's CSV export, Review's and Implementation's JSON exports) otherwise
 * duplicated individually. Each caller still builds its own payload/filename; this is just the
 * one, shared trigger. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
