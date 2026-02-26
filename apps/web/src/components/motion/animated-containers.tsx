'use client';

import { forwardRef, type ReactNode, type ComponentProps } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  fadeUpVariants,
  fadeScaleVariants,
  listContainerVariants,
  listItemVariants,
  cardVariants,
  pageVariants,
  expandVariants,
  transitions,
  getMotionVariants,
} from '@/lib/motion';
import { cn } from '@/lib/utils';

// ─── Motion Div (Base) ───────────────────────────────────────────────────────

export const MotionDiv = motion.div;

// ─── Animated Page Wrapper ───────────────────────────────────────────────────

interface AnimatedPageProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  className?: string;
}

export function AnimatedPage({ children, className, ...props }: AnimatedPageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={getMotionVariants(pageVariants, !!prefersReducedMotion)}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Fade Up Container ───────────────────────────────────────────────────────

interface FadeUpProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className, ...props }: FadeUpProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={getMotionVariants(fadeUpVariants, !!prefersReducedMotion)}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ...transitions.default, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Fade Scale Container ────────────────────────────────────────────────────

interface FadeScaleProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeScale({ children, delay = 0, className, ...props }: FadeScaleProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={getMotionVariants(fadeScaleVariants, !!prefersReducedMotion)}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ ...transitions.spring, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated List ───────────────────────────────────────────────────────────

interface AnimatedListProps extends ComponentProps<typeof motion.ul> {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className, ...props }: AnimatedListProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.ul
      variants={getMotionVariants(listContainerVariants, !!prefersReducedMotion)}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...props}
    >
      {children}
    </motion.ul>
  );
}

interface AnimatedListItemProps extends ComponentProps<typeof motion.li> {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className, ...props }: AnimatedListItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.li
      variants={getMotionVariants(listItemVariants, !!prefersReducedMotion)}
      className={className}
      {...props}
    >
      {children}
    </motion.li>
  );
}

// ─── Animated Card ───────────────────────────────────────────────────────────

interface AnimatedCardProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  hoverable?: boolean;
  className?: string;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, hoverable = true, className, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.div
        ref={ref}
        variants={getMotionVariants(cardVariants, !!prefersReducedMotion)}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover={hoverable && !prefersReducedMotion ? 'hover' : undefined}
        whileTap={hoverable && !prefersReducedMotion ? 'tap' : undefined}
        className={cn('rounded-lg border bg-card', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// ─── Animated Grid ───────────────────────────────────────────────────────────

interface AnimatedGridProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function AnimatedGrid({
  children,
  staggerDelay = 0.05,
  className,
  ...props
}: AnimatedGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Collapsible/Expandable Section ──────────────────────────────────────────

interface ExpandableProps {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
}

export function Expandable({ children, isOpen, className }: ExpandableProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          variants={getMotionVariants(expandVariants, !!prefersReducedMotion)}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Presence Container ──────────────────────────────────────────────────────

interface PresenceProps {
  children: ReactNode;
  show: boolean;
  mode?: 'sync' | 'wait' | 'popLayout';
}

export function Presence({ children, show, mode = 'sync' }: PresenceProps) {
  return (
    <AnimatePresence mode={mode}>
      {show && children}
    </AnimatePresence>
  );
}

// ─── Stagger Container ───────────────────────────────────────────────────────

interface StaggerContainerProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  staggerChildren?: number;
  delayChildren?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerChildren = 0.05,
  delayChildren = 0,
  className,
  ...props
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : staggerChildren,
            delayChildren: prefersReducedMotion ? 0 : delayChildren,
          },
        },
        exit: { opacity: 0 },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger Item ────────────────────────────────────────────────────────────

interface StaggerItemProps extends ComponentProps<typeof motion.div> {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={getMotionVariants(fadeUpVariants, !!prefersReducedMotion)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ─── Re-export AnimatePresence ───────────────────────────────────────────────

export { AnimatePresence, useReducedMotion };
