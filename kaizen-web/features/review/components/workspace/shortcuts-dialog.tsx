"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "A", description: "Approve the selected Kaizen" },
  { keys: "R", description: "Reject the selected Kaizen" },
  { keys: "C", description: "Focus the comment box" },
  { keys: "N", description: "Next Kaizen in the queue" },
  { keys: "P", description: "Previous Kaizen in the queue" },
  { keys: "?", description: "Show this list" },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Disabled while typing in a field.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{shortcut.description}</span>
              <kbd className="bg-muted rounded-md border px-2 py-1 font-mono text-xs">{shortcut.keys}</kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
