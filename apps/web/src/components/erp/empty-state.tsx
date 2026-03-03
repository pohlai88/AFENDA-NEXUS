'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Inbox, Search, ShieldX, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { transitions, DURATION, EASING } from '@/lib/motion';

import type {
  EmptyStateProps,
  EmptyStateVariant,
  EmptyStateConstraint,
  EmptyStateSize,
} from './empty-state.types';
import { CONSTRAINT_SLOTS } from './empty-state.types';
import { getEmptyStateContent } from './empty-state.registry';

// ─── Deprecation Bridge ──────────────────────────────────────────────────────

const SIZE_TO_CONSTRAINT: Record<EmptyStateSize, EmptyStateConstraint> = {
  sm: '1x1',
  md: '2x2',
  lg: 'page',
};

/** Tiers where animation is always off regardless of `animate` prop. */
const ANIMATION_DISABLED_TIERS = new Set<EmptyStateConstraint>(['1x1', '1x2']);

// ─── Default Icon Mapping ────────────────────────────────────────────────────

const variantIcons: Record<EmptyStateVariant, React.ElementType> = {
  firstRun: Sparkles,
  noResults: Search,
  error: AlertTriangle,
  forbidden: ShieldX,
};

// ─── CVA Variants (constraint-based) ─────────────────────────────────────────

const emptyStateVariants = cva('flex flex-col items-center justify-center rounded-lg text-center', {
  variants: {
    constraint: {
      '1x1': 'py-3 gap-1.5 border-0',
      '1x2': 'py-6 gap-2 border-0',
      '2x1': 'py-6 gap-2 border border-dashed',
      '2x2': 'py-8 gap-3 border border-dashed',
      table: 'py-8 gap-3 border border-dashed',
      page: 'py-16 gap-4 border border-dashed',
    },
  },
  defaultVariants: {
    constraint: '2x2',
  },
});

const iconVariants = cva('', {
  variants: {
    constraint: {
      '1x1': 'h-5 w-5',
      '1x2': 'h-5 w-5',
      '2x1': 'h-6 w-6',
      '2x2': 'h-8 w-8',
      table: 'h-8 w-8',
      page: 'h-12 w-12',
    },
    variant: {
      firstRun: 'text-primary/40',
      noResults: 'text-muted-foreground/50',
      error: 'text-destructive/60',
      forbidden: 'text-muted-foreground/30',
    },
  },
  defaultVariants: {
    constraint: '2x2',
    variant: 'firstRun',
  },
});

const titleVariants = cva('font-semibold', {
  variants: {
    constraint: {
      '1x1': 'text-xs',
      '1x2': 'text-xs',
      '2x1': 'text-sm',
      '2x2': 'text-sm',
      table: 'text-sm',
      page: 'text-base',
    },
  },
  defaultVariants: {
    constraint: '2x2',
  },
});

const descriptionVariants = cva('max-w-sm text-muted-foreground', {
  variants: {
    constraint: {
      '1x1': 'text-xs',
      '1x2': 'text-xs',
      '2x1': 'text-xs',
      '2x2': 'text-sm',
      table: 'text-sm',
      page: 'text-sm',
    },
  },
  defaultVariants: {
    constraint: '2x2',
  },
});

// ─── Motion Variants ─────────────────────────────────────────────────────────

const containerMotion = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const childMotion = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.springGentle,
  },
};

// ─── No-motion passthrough (renders plain divs with no animation overhead) ──

function StaticDiv(
  props: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }
) {
  const { ref, ...rest } = props;
  return <div ref={ref} {...rest} />;
}

// ─── Component ───────────────────────────────────────────────────────────────

function EmptyState({
  variant = 'firstRun',
  constraint: constraintProp,
  size,
  contentKey,
  title: titleProp,
  description: descriptionProp,
  icon: iconProp,
  action,
  animate = true,
  className,
  ref,
  ...props
}: EmptyStateProps & { ref?: React.Ref<HTMLDivElement> }) {
  // ── Resolve constraint (with deprecation bridge) ──
  let constraint: EmptyStateConstraint;
  if (constraintProp) {
    constraint = constraintProp;
  } else if (size) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[EmptyState] `size` is deprecated. Use `constraint` instead. ' +
          `Mapping size="${size}" → constraint="${SIZE_TO_CONSTRAINT[size]}".`
      );
    }
    constraint = SIZE_TO_CONSTRAINT[size];
  } else {
    constraint = '2x2';
  }

  // ── Resolve slots ──
  const slots = CONSTRAINT_SLOTS[constraint];

  // ── Resolve animation ──
  const prefersReduced = useReducedMotion();
  const tierAllowsAnimation = !ANIMATION_DISABLED_TIERS.has(constraint);
  const shouldAnimate = tierAllowsAnimation && animate && !prefersReduced;

  // Resolve content: direct props take precedence over registry
  const registryContent = contentKey ? getEmptyStateContent(contentKey, variant) : undefined;

  const title = titleProp ?? registryContent?.title ?? 'No data';
  const description = descriptionProp ?? registryContent?.description;

  // Resolve icon: prop > variant default > Inbox fallback
  const Icon = iconProp ?? variantIcons[variant] ?? Inbox;

  const wrapperClassName = cn(emptyStateVariants({ constraint }), className);

  const children = (
    Child: typeof motion.div | typeof StaticDiv,
    childProps: Record<string, unknown>
  ) => (
    <>
      {slots.icon && (
        <Child {...childProps}>
          <Icon className={iconVariants({ constraint, variant })} aria-hidden="true" />
        </Child>
      )}

      {slots.title && (
        <Child {...childProps}>
          <h3 className={titleVariants({ constraint })}>{title}</h3>
        </Child>
      )}

      {slots.description && description && (
        <Child {...childProps}>
          <p className={descriptionVariants({ constraint })}>{description}</p>
        </Child>
      )}

      {slots.action && action && (
        <Child {...childProps}>
          <div className="mt-1">{action}</div>
        </Child>
      )}
    </>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        ref={ref}
        role="status"
        aria-live="polite"
        className={wrapperClassName}
        variants={containerMotion}
        initial="initial"
        animate="animate"
      >
        {children(motion.div, { variants: childMotion })}
      </motion.div>
    );
  }

  return (
    <div ref={ref} role="status" aria-live="polite" className={wrapperClassName} {...props}>
      {children(StaticDiv, {})}
    </div>
  );
}

export { EmptyState, emptyStateVariants, iconVariants };
export type { EmptyStateProps } from './empty-state.types';
