"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt: string;
  /** Shown when there's no image, or the image fails to load. */
  fallback: string;
}

/**
 * Hand-rolled instead of @radix-ui/react-avatar — the only thing that primitive buys here is
 * load-failure fallback timing, which a plain onError handler covers for this use case.
 */
const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, fallback, className, ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);
    const showImage = Boolean(src) && !errored;

    return (
      <span
        ref={ref}
        className={cn(
          "bg-muted text-muted-foreground relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-medium",
          className,
        )}
        {...props}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary Clerk/Cloudinary hosts
          <img
            src={src ?? undefined}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span aria-hidden="true">{fallback}</span>
        )}
      </span>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar };
