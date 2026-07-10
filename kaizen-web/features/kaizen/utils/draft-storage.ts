import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

const STORAGE_KEY = "kaizen-wizard-draft";

export interface StoredDraft {
  draftId: string;
  step: number;
  values: WizardFormValues;
  savedAt: string;
}

/** Powers "Recover Draft after refresh" (KAIZEN-001) without a full drafts-list backend feature —
 * just enough to resume the one wizard session currently in progress on this browser. */
export function readStoredDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

export function writeStoredDraft(draft: StoredDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearStoredDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
