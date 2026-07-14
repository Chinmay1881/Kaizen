import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground bg-transparent",
        // Soft/tinted fills (a translucent tone-on-tone background + solid-tone text) read as
        // more refined than a fully saturated pill for status badges that appear densely in
        // lists/tables — reserving strong solid fills for the rarer, more deliberate `default`.
        success: "border-transparent bg-success/15 text-success dark:text-success",
        destructive: "border-transparent bg-destructive/15 text-destructive dark:text-destructive",
        warning: "border-transparent bg-warning/20 text-warning-foreground dark:bg-warning/25",
        info: "border-transparent bg-info/15 text-info dark:text-info",
        achievement: "border-transparent bg-achievement/20 text-achievement-foreground dark:bg-achievement/25",
        rewards: "border-transparent bg-rewards/15 text-rewards dark:text-rewards",
        implementation: "border-transparent bg-implementation/15 text-implementation dark:text-implementation",
        businessImpact: "border-transparent bg-business-impact/15 text-business-impact dark:text-business-impact",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
