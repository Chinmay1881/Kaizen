import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground max-w-md">The page you are looking for does not exist.</p>
      <Button asChild>
        <Link href={ROUTES.DASHBOARD}>Go to Dashboard</Link>
      </Button>
    </div>
  );
}
