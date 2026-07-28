"use client";

import { motion, useReducedMotion } from "framer-motion";

// Kept to emoji with a distinct, recognizable silhouette even at low opacity —
// "hole" and "no water" render as plain gray/red circles and just look like smudges.
const FLOATING_ITEMS = [
  { emoji: "💡", top: "16%", left: "6%", size: "text-5xl", duration: 7, delay: 0 },
  { emoji: "🗑️", top: "70%", left: "8%", size: "text-4xl", duration: 9, delay: 1.2 },
  { emoji: "🚧", top: "62%", left: "90%", size: "text-5xl", duration: 7.5, delay: 0.3 },
  { emoji: "📍", top: "14%", left: "91%", size: "text-4xl", duration: 8, delay: 0.6 },
  { emoji: "🔧", top: "44%", left: "3%", size: "text-3xl", duration: 10, delay: 1.6 },
  { emoji: "🚦", top: "80%", left: "88%", size: "text-3xl", duration: 8.5, delay: 2 },
];

/** Subtle drifting category emoji behind the hero content — decorative only. */
export default function FloatingEmojiBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {FLOATING_ITEMS.map((item, i) => (
        <motion.span
          key={i}
          className={`absolute ${item.size} opacity-30 drop-shadow-sm`}
          style={{ top: item.top, left: item.left }}
          animate={
            reduceMotion
              ? undefined
              : { y: [0, -18, 0], rotate: [0, 6, -6, 0] }
          }
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {item.emoji}
        </motion.span>
      ))}
    </div>
  );
}
