"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Same hidden/visible shape as `fadeInUpVariants` (`lib/motion.ts`) — defined locally rather than
// importing that variant object directly because its `visible.transition` has no `delay`, and a
// variant's own embedded transition takes precedence over a `transition` prop passed alongside it.
const fadeInVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

export function FadeIn({ className, delay = 0, children, ...props }: FadeInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
      transition={{ duration: DURATION.base, delay, ease: EASE.out }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
