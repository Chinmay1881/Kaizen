"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

interface SuccessScreenProps {
  kaizenNumber: string;
  onCreateAnother: () => void;
}

/**
 * KAIZEN-001 calls for a confetti animation here; that needs a canvas/particle library which
 * wasn't installed (no new packages without asking first). This uses a Framer Motion scale-in
 * instead — already a project dependency — as a lighter-weight stand-in.
 */
export function SuccessScreen({ kaizenNumber, onCreateAnother }: SuccessScreenProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-success/10 text-success flex h-20 w-20 items-center justify-center rounded-full"
      >
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Kaizen Submitted!</h1>
        <p className="text-muted-foreground">
          Your idea <span className="text-foreground font-medium">{kaizenNumber}</span> has been
          submitted and is now awaiting review.
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="flex items-center justify-between p-4 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">Submitted &middot; Pending Review</span>
        </CardContent>
      </Card>

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="flex-1" onClick={onCreateAnother}>
          Create Another Kaizen
        </Button>
        <Button asChild className="flex-1">
          <Link href={ROUTES.DASHBOARD}>Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
