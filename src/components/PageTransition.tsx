import { motion, type Variants } from "framer-motion";
import { type ReactNode, forwardRef } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const variants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    filter: "blur(4px)"
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    filter: "blur(4px)",
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    }
  }
};

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = "PageTransition";
