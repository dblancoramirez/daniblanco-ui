"use client";

import { animate, motion, useMotionValue, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

/**
 * daniblanco-ui · JellyButton
 *
 * Botón redondo flotante: al pulsarlo se hunde y su contenido se aplasta como
 * una gota, y rebota al soltar. Pensado para ir junto a la TabBar (`trailing`),
 * pero sirve en cualquier sitio.
 *
 * Colores con variables CSS (opcionales): --dbui-accent, --dbui-accent-contrast
 * y --dbui-accent-glow.
 */

export interface JellyButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: ReactNode;
  /** Diámetro en píxeles. */
  size?: number;
  /** Cuánto se aplasta el contenido al pulsar (0 = nada). */
  squash?: number;
}

/** Muelle con rebote para volver a la forma original. */
const JELLY = { type: "spring", stiffness: 520, damping: 14, mass: 0.7 } as const;
const PRESS = { type: "spring", stiffness: 700, damping: 22 } as const;

export function JellyButton({
  children = <PlusGlyph />,
  size = 62,
  squash: amount = 0.3,
  className,
  style,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  ...props
}: JellyButtonProps) {
  const reduceMotion = useReducedMotion();
  const scale = useMotionValue(1);
  const contentX = useMotionValue(1);
  const contentY = useMotionValue(1);
  const squash = (on: boolean) => {
    if (reduceMotion) return;
    const spring = on ? PRESS : JELLY;
    void animate(scale, on ? 0.9 : 1, spring);
    void animate(contentX, on ? 1 + amount : 1, spring);
    void animate(contentY, on ? 1 - amount * 0.93 : 1, spring);
  };
  return (
    <motion.button
      type="button"
      {...props}
      onPointerDown={(e) => (squash(true), onPointerDown?.(e))}
      onPointerUp={(e) => (squash(false), onPointerUp?.(e))}
      onPointerLeave={(e) => (squash(false), onPointerLeave?.(e))}
      onPointerCancel={(e) => (squash(false), onPointerCancel?.(e))}
      className={["pointer-events-auto relative grid shrink-0 touch-manipulation place-items-center overflow-hidden rounded-full", className].filter(Boolean).join(" ")}
      style={{
        width: size,
        height: size,
        scale,
        background: "var(--dbui-accent, #5856d6)",
        color: "var(--dbui-accent-contrast, #ffffff)",
        boxShadow: "0 8px 22px var(--dbui-accent-glow, rgba(88, 86, 214, 0.45))",
        ...style,
      }}
    >
      {/* Brillo de cristal en el borde superior. */}
      <span aria-hidden className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.35),rgba(255,255,255,0)_55%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]" />
      <motion.span className="relative grid place-items-center" style={{ scaleX: contentX, scaleY: contentY }}>
        {children}
      </motion.span>
    </motion.button>
  );
}

/** «+» por defecto, para no depender de una librería de iconos. */
function PlusGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 256 256" fill="none" aria-hidden>
      <path d="M40 128h176M128 40v176" stroke="currentColor" strokeWidth="24" strokeLinecap="round" />
    </svg>
  );
}
