"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

/**
 * daniblanco-ui · TabBar
 *
 * Barra de pestañas al estilo de iOS 27: una cápsula de cristal con una «lente»
 * que marca la pestaña activa. La lente se comporta como una gota: crece al
 * pulsarla, se estira al moverla y tiñe del color de acento justo lo que cubre.
 * Se puede arrastrar por la barra; al soltarla se imanta a la pestaña más
 * cercana.
 *
 * Funciona sola (`value` + `onValueChange`) o enlazada a un paginador con
 * `progress`, una posición continua (0 = primera pestaña) que mueve la lente
 * mientras se deslizan las pantallas.
 *
 * Colores con variables CSS (todas opcionales): --dbui-accent, --dbui-label,
 * --dbui-glass, --dbui-lens, --dbui-border y --dbui-shadow.
 */

export type TabIcon = ComponentType<{ size?: number; weight?: "regular" | "fill" }>;

export interface TabBarItem {
  /** Texto de la pestaña (y su nombre accesible). */
  label: string;
  /** Icono; recibe `weight="fill"` dentro de la lente y `"regular"` fuera. */
  icon?: TabIcon;
  /** Con `href` la pestaña es un enlace (abrir en otra pestaña, lectores de pantalla…). */
  href?: string;
}

export interface TabBarProps {
  items: TabBarItem[];
  /** Pestaña activa; -1 para ninguna (se oculta la lente). */
  value: number;
  /** Al tocar una pestaña o soltar la lente sobre ella. */
  onValueChange?: (index: number) => void;
  /** Posición continua compartida con un paginador; si no se pasa, la lente sigue a `value`. */
  progress?: MotionValue<number>;
  /** Lo que va a la derecha de la cápsula: un botón, un avatar… */
  trailing?: ReactNode;
  /** Lo que va a la izquierda de la cápsula. */
  leading?: ReactNode;
  /** `fixed` (por defecto) la pega al borde inferior respetando el área segura; `static` la deja en su sitio. */
  position?: "fixed" | "static";
  /** Alto de la cápsula en píxeles. */
  height?: number;
  /** Muestra los textos bajo los iconos. */
  showLabels?: boolean;
  /** Efecto gota: crece al pulsar y se estira al moverse. */
  liquid?: boolean;
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
}

/** Alto por defecto de la zona de la barra (sin el área segura): la cápsula y su margen. */
export const TAB_BAR_HEIGHT = 78;
const DEFAULT_PILL_HEIGHT = 62;
const LENS_INSET = 4;
/** Muelle con rebote para los gestos «líquidos». */
const JELLY = { type: "spring", stiffness: 520, damping: 14, mass: 0.7 } as const;

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export function TabBar({
  items,
  value,
  onValueChange,
  progress: external,
  trailing,
  leading,
  position = "fixed",
  height: pillHeight = DEFAULT_PILL_HEIGHT,
  showLabels = true,
  liquid = true,
  "aria-label": ariaLabel = "Secciones",
  className,
  style,
}: TabBarProps) {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion || !liquid;
  const last = items.length - 1;
  const lensHeight = pillHeight - LENS_INSET * 2;
  const radius = lensHeight / 2;

  // Sin paginador, la posición es la pestaña activa.
  const own = useMotionValue(Math.max(0, value));
  useEffect(() => {
    if (!external && value >= 0) own.set(value);
  }, [external, own, value]);
  const progress = external ?? own;

  const pill = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ pill: 0, tab: 0 });
  const tabWidth = size.tab;

  /** Posición (0…n-1) de la lente mientras se arrastra por la barra; -1 si no. */
  const scrubPos = useMotionValue(-1);
  // La lente sigue la posición con un muelle rígido: casi pegada al dedo y suave al tocar una pestaña lejana.
  const lensTarget = useTransform([progress, scrubPos], ([p, s]: number[]) => (s >= 0 ? s : Math.max(0, Math.min(last, p))) * tabWidth);
  const lensX = useSpring(lensTarget, reduceMotion ? { duration: 0 } : { stiffness: 700, damping: 48, mass: 0.8 });
  // Cuanto más rápido se mueve, más se estira a lo ancho y se aplana (como una gota).
  const velocity = useVelocity(lensX);
  const stretch = useSpring(
    useTransform(velocity, (v) => (still ? 0 : Math.min(0.32, Math.abs(v) / 1600))),
    { stiffness: 900, damping: 40 },
  );
  /** 1 en reposo; crece al pulsar. */
  const lift = useMotionValue(1);
  /** 0 en reposo; 1 mientras se pulsa (cristal transparente con brillo). */
  const glassy = useMotionValue(0);
  const scaleX = useTransform([lift, stretch], ([l, s]: number[]) => l * (1 + s));
  const scaleY = useTransform([lift, stretch], ([l, s]: number[]) => l * (1 - s * 0.45));
  const tint = useTransform(glassy, (g) => 1 - g * 0.65);

  /** Hueco que ocupa la lente (con su deformación), en píxeles de la cápsula. */
  const lensRect = (x: number, sx: number, sy: number) => {
    const width = tabWidth * sx;
    const left = LENS_INSET + x + (tabWidth - width) / 2;
    const top = LENS_INSET + (lensHeight * (1 - sy)) / 2;
    return { left, width, top, bottom: pillHeight - top, r: Math.min(radius, width / 2, (pillHeight - 2 * top) / 2) };
  };
  // Las pestañas en color de acento solo se ven dentro de la lente…
  const clip = useTransform([lensX, scaleX, scaleY], ([x, sx, sy]: number[]) => {
    const { left, width, top } = lensRect(x, sx, sy);
    const right = Math.max(0, size.pill - left - width);
    return `inset(${top}px ${right}px ${top}px ${left}px round ${radius}px)`;
  });
  // …y las normales, solo fuera: así no asoman por los huecos de los iconos rellenos.
  const hole = useTransform([lensX, scaleX, scaleY], ([x, sx, sy]: number[]) => {
    const { left, width, top, bottom, r } = lensRect(x, sx, sy);
    const right = left + width;
    return (
      `path(evenodd, "M0 0H${size.pill}V${pillHeight}H0Z` +
      `M${left + r} ${top}H${right - r}A${r} ${r} 0 0 1 ${right} ${top + r}V${bottom - r}A${r} ${r} 0 0 1 ${right - r} ${bottom}` +
      `H${left + r}A${r} ${r} 0 0 1 ${left} ${bottom - r}V${top + r}A${r} ${r} 0 0 1 ${left + r} ${top}Z")`
    );
  });
  const scrub = useRef<{ id: number; x: number; active: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = pill.current;
    if (!el) return;
    const measure = () => setSize({ pill: el.clientWidth, tab: (el.clientWidth - LENS_INSET * 2) / items.length });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  /** Posición (0…n-1) bajo el dedo, con la lente centrada en él. */
  const positionAt = (clientX: number) => {
    const rect = pill.current!.getBoundingClientRect();
    return Math.max(0, Math.min(last, (clientX - rect.left - LENS_INSET) / tabWidth - 0.5));
  };

  const select = (index: number) => {
    // Sin paginador, la lente se coloca ya; el `value` nuevo llegará después.
    if (!external) own.set(index);
    if (index !== value) onValueChange?.(index);
  };

  const press = (on: boolean) => {
    if (still) return;
    void animate(lift, on ? 1.14 : 1, on ? { type: "spring", stiffness: 600, damping: 26 } : JELLY);
    void animate(glassy, on ? 1 : 0, { duration: on ? 0.12 : 0.28 });
  };

  // Toda la cápsula responde al dedo: al apoyar se eleva la lente; si se arrastra,
  // la lente sigue al dedo; al soltar se imanta a la pestaña más cercana (o a la tocada).
  const release = (clientX: number | null) => {
    const s = scrub.current;
    scrub.current = null;
    press(false);
    if (!s) return;
    if (s.active) select(Math.round(scrubPos.get()));
    else if (clientX !== null) select(Math.round(positionAt(clientX)));
    scrubPos.set(-1);
  };
  const scrubHandlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!tabWidth || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      scrub.current = { id: e.pointerId, x: e.clientX, active: false };
      press(true);
      try {
        // El gesto sigue aunque el dedo salga de la cápsula.
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* puntero ya liberado */
      }
    },
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
      const s = scrub.current;
      if (!s || s.id !== e.pointerId) return;
      if (!s.active && Math.abs(e.clientX - s.x) < 4) return;
      s.active = true;
      scrubPos.set(positionAt(e.clientX));
    },
    onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
      if (scrub.current?.id === e.pointerId) release(e.clientX);
    },
    onPointerCancel: () => release(null),
  };

  const tabs = (tinted: boolean) =>
    items.map(({ label, icon: Icon, href }, i) => {
      const content = (
        <>
          {Icon && <Icon size={24} weight={tinted ? "fill" : "regular"} />}
          {showLabels && <span className="max-w-full truncate">{label}</span>}
        </>
      );
      const cls = "relative flex min-w-0 flex-1 select-none flex-col items-center justify-center gap-0.5 rounded-full text-[clamp(9px,2.5vw,10px)] font-semibold [-webkit-touch-callout:none]";
      if (tinted) {
        return (
          <span key={i} className={cls} style={{ color: "var(--dbui-accent, #5856d6)" }}>
            {content}
          </span>
        );
      }
      const common = {
        className: cls,
        "aria-label": showLabels ? undefined : label,
        "aria-current": i === value ? ("page" as const) : undefined,
        style: { color: "var(--dbui-label, currentColor)" },
        // Con dedo o ratón manda la cápsula (también si el toque cae entre pestañas);
        // el clic sin puntero (teclado, lectores de pantalla) llega con detail 0.
        onClick: (e: ReactMouseEvent) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          if (e.detail === 0) select(i);
        },
      };
      return href ? (
        <a key={i} href={href} draggable={false} {...common}>
          {content}
        </a>
      ) : (
        <button key={i} type="button" {...common}>
          {content}
        </button>
      );
    });

  const ready = value >= 0 && tabWidth > 0;
  const bar = (
    <div className="flex h-full items-end gap-3">
      {leading}
      <div
        ref={pill}
        {...scrubHandlers}
        data-tab-bar-pill
        className="pointer-events-auto relative flex min-w-0 flex-1 touch-none rounded-full backdrop-blur-xl backdrop-saturate-[1.8]"
        style={{
          height: pillHeight,
          background: "var(--dbui-glass, rgba(249, 249, 251, 0.8))",
          boxShadow: "var(--dbui-shadow, 0 10px 40px rgba(0, 0, 0, 0.16)), 0 0 0 1px var(--dbui-border, rgba(60, 60, 67, 0.16))",
        }}
      >
        {ready && (
          <motion.span aria-hidden className="absolute rounded-full" style={{ top: LENS_INSET, left: LENS_INSET, height: lensHeight, width: tabWidth, x: lensX, scaleX, scaleY }}>
            {/* Tinte en reposo; al pulsar se aclara y deja ver el cristal. */}
            <motion.span className="absolute inset-0 rounded-full" style={{ opacity: tint, background: "var(--dbui-lens, rgba(118, 118, 128, 0.2))" }} />
            <motion.span
              className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0.04)_55%,rgba(255,255,255,0.12))] shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_2px_rgba(0,0,0,0.12),0_6px_16px_rgba(0,0,0,0.22)] ring-1 ring-white/40 backdrop-blur-[1.5px] backdrop-saturate-200"
              style={{ opacity: glassy }}
            />
          </motion.span>
        )}
        <motion.div className="absolute inset-0 z-10 flex" style={{ padding: LENS_INSET, clipPath: ready ? hole : undefined }}>
          {tabs(false)}
        </motion.div>
        {/* Las pestañas otra vez en color de acento, recortadas a la forma de la lente. */}
        {ready && (
          <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex" style={{ padding: LENS_INSET, clipPath: clip }}>
            {tabs(true)}
          </motion.div>
        )}
      </div>
      {trailing}
    </div>
  );

  if (position === "static") {
    return (
      <nav aria-label={ariaLabel} className={className} style={style}>
        {bar}
      </nav>
    );
  }
  return (
    <nav
      aria-label={ariaLabel}
      className={cx("pointer-events-none fixed inset-x-0 bottom-0 z-40", className)}
      // Un poco más abajo que el área segura completa, sin llegar a rozar el borde.
      style={{
        height: `calc(env(safe-area-inset-bottom) + ${pillHeight + 16}px)`,
        padding: "0 calc(env(safe-area-inset-right) + 16px) max(calc(env(safe-area-inset-bottom) - 10px), 6px) calc(env(safe-area-inset-left) + 16px)",
        ...style,
      }}
    >
      {bar}
    </nav>
  );
}

/** Hueco al final de un contenido con scroll para que lo último no quede bajo la barra fija. */
export function TabBarSpacer({ height = TAB_BAR_HEIGHT }: { height?: number }) {
  return <div aria-hidden data-tabbar-spacer className="shrink-0" style={{ height: `calc(env(safe-area-inset-bottom) + ${height}px)` }} />;
}
