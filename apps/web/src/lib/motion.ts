import type { Variants, Transition } from 'framer-motion';

// ─── Timing Constants ────────────────────────────────────────────────────────

export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.4,
} as const;

export const EASING = {
  linear: [0, 0, 1, 1],
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.2, 1],
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  springBouncy: { type: 'spring', stiffness: 500, damping: 25 },
  springGentle: { type: 'spring', stiffness: 300, damping: 35 },
} as const;

// ─── Common Transitions ──────────────────────────────────────────────────────

export const transitions = {
  default: {
    duration: DURATION.normal,
    ease: EASING.easeOut,
  } satisfies Transition,
  
  fast: {
    duration: DURATION.fast,
    ease: EASING.easeOut,
  } satisfies Transition,
  
  slow: {
    duration: DURATION.slow,
    ease: EASING.easeInOut,
  } satisfies Transition,
  
  spring: EASING.spring,
  
  springBouncy: EASING.springBouncy,
  
  springGentle: EASING.springGentle,
  
  stagger: (staggerChildren = 0.05, delayChildren = 0) => ({
    staggerChildren,
    delayChildren,
  }),
};

// ─── Fade Variants ───────────────────────────────────────────────────────────

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const fadeDownVariants: Variants = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ─── Slide Variants ──────────────────────────────────────────────────────────

export const slideInLeftVariants: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideInRightVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const slideUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// ─── List/Stagger Variants ───────────────────────────────────────────────────

export const listContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.springGentle,
  },
  exit: { opacity: 0, y: -8 },
};

// ─── Card Variants ───────────────────────────────────────────────────────────

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.spring,
  },
  exit: { opacity: 0, y: 8, scale: 0.98 },
  hover: { y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
  tap: { scale: 0.98 },
};

export const cardGridVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ─── Page Transition Variants ────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: DURATION.normal,
      ease: EASING.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: DURATION.fast,
      ease: EASING.easeIn,
    },
  },
};

// ─── Modal/Dialog Variants ───────────────────────────────────────────────────

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: transitions.fast,
  },
};

// ─── Sheet/Drawer Variants ───────────────────────────────────────────────────

export const sheetRightVariants: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: transitions.spring },
  exit: { x: '100%', transition: transitions.default },
};

export const sheetLeftVariants: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0, transition: transitions.spring },
  exit: { x: '-100%', transition: transitions.default },
};

export const sheetBottomVariants: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: transitions.spring },
  exit: { y: '100%', transition: transitions.default },
};

// ─── Toast Variants ──────────────────────────────────────────────────────────

export const toastVariants: Variants = {
  initial: { opacity: 0, y: 50, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: transitions.fast,
  },
};

// ─── Table Row Variants ──────────────────────────────────────────────────────

export const tableRowVariants: Variants = {
  initial: { opacity: 0, backgroundColor: 'transparent' },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  hover: { backgroundColor: 'var(--accent)' },
};

// ─── Expand/Collapse Variants ────────────────────────────────────────────────

export const expandVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: transitions.spring,
      opacity: { duration: DURATION.normal, delay: 0.05 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: transitions.default,
      opacity: { duration: DURATION.fast },
    },
  },
};

// ─── Skeleton/Pulse Variants ─────────────────────────────────────────────────

export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ─── Highlight/Flash Variants ────────────────────────────────────────────────

export const highlightVariants: Variants = {
  initial: { backgroundColor: 'transparent' },
  animate: {
    backgroundColor: ['transparent', 'var(--accent)', 'transparent'],
    transition: {
      duration: 1,
      times: [0, 0.3, 1],
    },
  },
};

// ─── Reduced Motion Support ──────────────────────────────────────────────────

export const reducedMotionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function getMotionVariants(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  return prefersReducedMotion ? reducedMotionVariants : variants;
}

// ─── Animation Presets for Common Patterns ──────────────────────────────────

export const animationPresets = {
  page: {
    variants: pageVariants,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
  },
  
  card: {
    variants: cardVariants,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
    whileHover: 'hover',
    whileTap: 'tap',
  },
  
  list: {
    container: {
      variants: listContainerVariants,
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
    },
    item: {
      variants: listItemVariants,
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
    },
  },
  
  fadeUp: {
    variants: fadeUpVariants,
    initial: 'initial',
    animate: 'animate',
    exit: 'exit',
  },
  
  modal: {
    overlay: {
      variants: overlayVariants,
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
    },
    content: {
      variants: modalVariants,
      initial: 'initial',
      animate: 'animate',
      exit: 'exit',
    },
  },
} as const;
