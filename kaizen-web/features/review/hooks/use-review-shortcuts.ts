"use client";

import { useEffect } from "react";

interface ReviewShortcutHandlers {
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onFocusComment?: () => void;
  onShowHelp?: () => void;
}

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable;
}

/**
 * Frontend-only keyboard shortcuts for the Review Workspace (A/R/C/N/P/?) — disabled while
 * typing in any field (so e.g. typing "can" in a comment doesn't trigger Approve), and while any
 * modifier key is held (so browser/OS shortcuts like Cmd+R still work normally).
 */
export function useReviewShortcuts(handlers: ReviewShortcutHandlers) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key.toLowerCase()) {
        case "a":
          if (handlers.onApprove) {
            event.preventDefault();
            handlers.onApprove();
          }
          break;
        case "r":
          if (handlers.onReject) {
            event.preventDefault();
            handlers.onReject();
          }
          break;
        case "c":
          if (handlers.onFocusComment) {
            event.preventDefault();
            handlers.onFocusComment();
          }
          break;
        case "n":
          if (handlers.onNext) {
            event.preventDefault();
            handlers.onNext();
          }
          break;
        case "p":
          if (handlers.onPrevious) {
            event.preventDefault();
            handlers.onPrevious();
          }
          break;
        case "?":
          if (handlers.onShowHelp) {
            event.preventDefault();
            handlers.onShowHelp();
          }
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  });
}
