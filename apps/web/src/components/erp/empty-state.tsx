'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Inbox, Search, ShieldX, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { transitions, DURATION, EASING } from '@/lib/motion';

import type { EmptyStateProps, EmptyStateVariant } from './empty-state.types';
import { getEmptyStateContent } from './empty-state.registry';

// ─── Default Icon Mapping ────────────────────────────────────────────────────

const variantIcons: Record<EmptyStateVariant, React.ElementType> = {
  firstRun: Sparkles,
  noResults: Search,
  error: AlertTriangle,
  forbidden: ShieldX,
};

// ─── CVA Variants ────────────────────────────────────────────────────────────

const emptyStateVariants = cva(
  'flex flex-col items-center justify-center rounded-lg border border-dashed text-center',
  {
    variants: {
      size: {
        sm: 'py-6 gap-2',
        md: 'py-10 gap-3',
        lg: 'py-16 gap-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    },
    variant: {
      firstRun: 'text-primary/40',
      noResults: 'text-muted-foreground/50',
      error: 'text-destructive/60',
      forbidden: 'text-muted-foreground/30',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'firstRun',
  },
});

const titleVariants = cva('font-semibold', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const descriptionVariants = cva('max-w-sm text-muted-foreground', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-sm',
    },
  },
  defaultVariants: {
    size: 'md',
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

const staticDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />,
);
staticDiv.displayName = 'StaticDiv';

// ─── Component ───────────────────────────────────────────────────────────────

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      variant = 'firstRun',
      size = 'md',
      contentKey,
      title: titleProp,
      description: descriptionProp,
      icon: iconProp,
      action,
      animate = true,
      className,
      ...props
    },
    ref,
  ) => {
    const prefersReduced = useReducedMotion();
    const shouldAnimate = animate && !prefersReduced;

    // Resolve content: direct props take precedence over registry
    const registryContent = contentKey
      ? getEmptyStateContent(contentKey, variant)
      : undefined;

    const title = titleProp ?? registryContent?.title ?? 'No data';
    const description = descriptionProp ?? registryContent?.description;

    // Resolve icon: prop > variant default > Inbox fallback
    const Icon = iconProp ?? variantIcons[variant] ?? Inbox;

    const wrapperClassName = cn(emptyStateVariants({ size }), className);

    const children = (Child: typeof motion.div | typeof staticDiv, childProps: Record<string, unknown>) => (
      <>
        <Child {...childProps}>
          <Icon
            className={iconVariants({ size, variant })}
            aria-hidden="true"
          />
        </Child>

        <Child {...childProps}>
          <h3 className={titleVariants({ size })}>{title}</h3>
        </Child>

        {description && (
          <Child {...childProps}>
            <p className={descriptionVariants({ size })}>{description}</p>
          </Child>
        )}

        {action && (
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
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={wrapperClassName}
        {...props}
      >
        {children(staticDiv, {})}
      </div>
    );
  },
);
EmptyState.displayName = 'EmptyState';

export { EmptyState, emptyStateVariants, iconVariants };
export type { EmptyStateProps } from './empty-state.types';
