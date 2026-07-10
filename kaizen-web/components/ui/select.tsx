import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Wraps a native <select> rather than @radix-ui/react-select — the option lists this app needs
 * (departments, categories) are short and finite, so a native select gives full keyboard/screen
 * reader support for free without a new dependency. Revisit if a future list needs search/large
 * option counts.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "border-input bg-background focus-visible:ring-ring flex h-12 w-full appearance-none rounded-lg border px-3 py-2 pr-10 text-base shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
