/** All motion constants in one place so the whole site's feel is tuned here. */
export const SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;
export const EASE = [0.22, 1, 0.36, 1] as const;
export const FADE = { duration: 0.45, ease: EASE } as const;
export const EXIT_MS = 200;
export const STAGGER_S = 0.04;
export const KNOB_MS = 250;
export const REDUCED_S = 0.15;
export const EDGE_DRAW_S = 0.4;
export const SETTLE_MS = 700;
export const SLOW_FACTOR = 4;
