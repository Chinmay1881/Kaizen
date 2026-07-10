import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DraftRecoveryPromptProps {
  open: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

/** Powers KAIZEN-001's "Recover Draft after refresh" — shown once on wizard mount if a
 * localStorage draft snapshot exists (see features/kaizen/utils/draft-storage.ts). */
export function DraftRecoveryPrompt({ open, onResume, onDiscard }: DraftRecoveryPromptProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume your Kaizen draft?</AlertDialogTitle>
          <AlertDialogDescription>
            You have an unsaved Kaizen in progress. Continue where you left off, or start a new one
            and discard the saved draft.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Start New</AlertDialogCancel>
          <AlertDialogAction onClick={onResume}>Resume Draft</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
