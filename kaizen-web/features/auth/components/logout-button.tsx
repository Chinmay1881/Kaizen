"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  /** Renders as an icon-only button (header) instead of a labelled one (sidebar/settings). */
  iconOnly?: boolean;
}

/**
 * Implements the Logout Flow from docs/product/02_PRODUCT_REQUIREMENTS.md (AUTH-001):
 * Click Logout -> Confirmation Dialog -> Destroy Session -> Clear Cache -> Redirect Login.
 * "Redirect Login" is handled by Clerk itself via NEXT_PUBLIC_CLERK_SIGN_OUT_FALLBACK_REDIRECT_URL.
 */
export function LogoutButton({ iconOnly = false }: LogoutButtonProps) {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleConfirm() {
    setIsSigningOut(true);
    try {
      // Drop every cached query so no user-specific data survives into the next session
      // on a shared browser (e.g. a kiosk/shared workstation scenario).
      queryClient.clear();
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" className="justify-start gap-3">
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Log out of Muliya Kaizan?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll be signed out of your current session and returned to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Log out"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
