"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { overlayVariants, scaleInVariants } from "@/lib/motion";
import { useMounted } from "@/hooks/use-mounted";

/**
 * A hand-rolled Dialog (no new Radix dependency — this codebase already avoids adding
 * @radix-ui/react-dialog, see Select/Tooltip). Renders via `createPortal` rather than the native
 * `<dialog>` element: native `<dialog>` open/close is imperative and its `::backdrop` can't
 * cleanly run an exit animation alongside `AnimatePresence`, which is what "themed to the Motion
 * System" (`overlayVariants`/`scaleInVariants`) actually requires. Focus trap, Escape-to-close,
 * click-outside, and scroll lock are implemented explicitly below in their place.
 */

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext(component: string) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error(`<${component} /> must be used within a <Dialog>`);
  return context;
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  return (
    <DialogContext.Provider value={{ open, onOpenChange, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<React.ComponentProps<typeof motion.div>, "children"> & {
  children?: React.ReactNode;
  showCloseButton?: boolean;
}) {
  const { open, onOpenChange, titleId, descriptionId } = useDialogContext("DialogContent");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const mounted = useMounted();

  React.useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement as HTMLElement | null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = contentRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable?.[0] ?? contentRef.current)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }
      if (event.key !== "Tab" || !contentRef.current) return;
      const items = contentRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open, onOpenChange]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <motion.div
            ref={contentRef}
            variants={scaleInVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className={cn(
              "bg-background relative z-10 grid w-full max-w-md gap-4 rounded-xl border p-6 shadow-[var(--shadow-xl)] focus:outline-none",
              className,
            )}
            {...props}
          >
            {children}
            {showCloseButton ? (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground absolute top-4 right-4 rounded-md p-1 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function DialogTrigger({
  asChild,
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = useDialogContext("DialogTrigger");

  if (asChild && React.isValidElement<React.ComponentProps<"button">>(children)) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        children.props.onClick?.(event);
        onOpenChange(true);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        onOpenChange(true);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-6 text-left", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext("DialogTitle");
  return <h2 id={titleId} className={cn("text-base font-semibold", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext("DialogDescription");
  return <p id={descriptionId} className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function DialogClose({
  asChild,
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = useDialogContext("DialogClose");

  if (asChild && React.isValidElement<React.ComponentProps<"button">>(children)) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        children.props.onClick?.(event);
        onOpenChange(false);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        onOpenChange(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose };
