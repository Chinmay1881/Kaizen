"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { menuVariants } from "@/lib/motion";
import { useMounted } from "@/hooks/use-mounted";

/**
 * Hand-rolled Dropdown Menu (no new Radix dependency — same rationale as `Dialog`/`Select`).
 * Positions itself via the trigger's `getBoundingClientRect()` rather than a floating-ui
 * dependency; the menus this app needs (row actions, user menu) are short, single-level, and
 * anchored to a visible trigger, so a fixed-position portal with a basic bottom-edge flip covers
 * every real use case without adding positioning-library weight.
 */

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext(component: string) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error(`<${component} /> must be used within a <DropdownMenu>`);
  return context;
}

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function DropdownMenu({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({
  asChild,
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext("DropdownMenuTrigger");

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    setOpen(!open);
  };

  if (asChild && React.isValidElement<React.ComponentProps<"button">>(children)) {
    return React.cloneElement(children, {
      ref: triggerRef as React.Ref<HTMLButtonElement>,
      "aria-haspopup": "menu",
      "aria-expanded": open,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        children.props.onClick?.(event);
        setOpen(!open);
      },
    } as React.ComponentProps<"button">);
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

const ITEM_SELECTOR = '[role="menuitem"]:not([data-disabled])';

interface DropdownMenuContentProps extends Omit<React.ComponentProps<typeof motion.div>, "children"> {
  children?: React.ReactNode;
  align?: "start" | "end";
}

function DropdownMenuContent({ className, align = "start", children, ...props }: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useDropdownMenuContext("DropdownMenuContent");
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const mounted = useMounted();

  React.useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = contentRef.current?.offsetWidth ?? 200;
    const menuHeight = contentRef.current?.offsetHeight ?? 0;
    const flipUp = rect.bottom + menuHeight + 8 > window.innerHeight && rect.top > menuHeight;

    setPosition({
      top: flipUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left: align === "end" ? rect.right - menuWidth : rect.left,
    });
  }, [open, align, triggerRef]);

  React.useEffect(() => {
    if (!open) return;

    const items = () => contentRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR);
    items()?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const list = items();
      if (!list || list.length === 0) return;
      const currentIndex = Array.from(list).indexOf(document.activeElement as HTMLElement);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        list[(currentIndex + 1 + list.length) % list.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        list[(currentIndex - 1 + list.length) % list.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        list[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        list[list.length - 1]?.focus();
      } else if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        (triggerRef.current as HTMLElement | null)?.focus();
      } else if (event.key === "Tab") {
        setOpen(false);
      }
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && position ? (
        <motion.div
          ref={contentRef}
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="menu"
          style={{ position: "fixed", top: position.top, left: position.left }}
          className={cn(
            "bg-popover text-popover-foreground z-50 min-w-[10rem] overflow-hidden rounded-lg border p-1 shadow-[var(--shadow-lg)] focus:outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
  variant?: "default" | "destructive";
}

function DropdownMenuItem({ className, disabled, variant = "default", onClick, onKeyDown, ...props }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext("DropdownMenuItem");

  return (
    <div
      role="menuitem"
      tabIndex={-1}
      data-disabled={disabled ? "" : undefined}
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) return;
        onClick?.(event);
        setOpen(false);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          (event.currentTarget as HTMLElement).click();
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors duration-100 outline-none select-none",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        variant === "destructive" && "text-destructive hover:bg-destructive/10 focus:bg-destructive/10",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn("bg-border -mx-1 my-1 h-px", className)} {...props} />;
}

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-muted-foreground px-2.5 py-1.5 text-xs font-semibold tracking-wide uppercase", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
