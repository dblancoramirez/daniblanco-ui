"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * daniblanco-ui · TabPager
 *
 * Pantallas una al lado de otra que se pasan deslizando, como un paginador de
 * iOS. Una sola posición continua (`progress`: 0 = primera pantalla) mueve las
 * pantallas y, si se le pasa a la TabBar, también su lente: al deslizar se ve
 * entrar la siguiente y la lente nunca va por su cuenta.
 *
 * No depende del enrutador: recibe la pantalla activa (`index`) y avisa del
 * cambio con `onIndexChange`.
 */

/** Muelle del paginador al soltar. */
const SPRING = { type: "spring", damping: 34, stiffness: 380, mass: 0.9 } as const;

export interface PagerOptions {
  /** Número de pantallas. */
  count: number;
  /** Pantalla activa; -1 si ahora mismo no se muestra ninguna (otra ruta). */
  index: number;
  /** Se llama al cambiar de pantalla con un gesto o un toque. */
  onIndexChange: (index: number) => void;
  /** Montar todas las pantallas desde el principio en vez de al visitarlas. */
  eager?: boolean;
}

export function usePager({ count, index, onIndexChange, eager = false }: PagerOptions) {
  const reduceMotion = useReducedMotion();
  const last = count - 1;
  const progress = useMotionValue(Math.max(0, index));
  /** Mientras un dedo arrastra las pantallas, el `index` de fuera no manda sobre la posición. */
  const holding = useRef(false);
  /** Pantalla a la que se está soltando un gesto: su cambio de `index` no debe recolocar nada. */
  const settling = useRef<number | null>(null);
  // Se monta una pantalla al visitarla o al deslizar hacia ella, y luego se conserva (con su scroll y su estado).
  const [mounted, setMounted] = useState<Set<number>>(() => new Set(eager ? range(count) : index >= 0 ? [index] : []));

  // Ir a una pantalla desde fuera (tocar una pestaña, volver atrás…): aparece directamente, como en iOS.
  const [lastIndex, setLastIndex] = useState(index);
  if (index !== lastIndex) {
    setLastIndex(index);
    if (index >= 0 && !mounted.has(index)) setMounted(union(mounted, new Set([index])));
  }
  useEffect(() => {
    if (index < 0) return;
    // El `index` que llega es el del gesto que ya se está soltando: no se toca su animación.
    if (settling.current === index) {
      settling.current = null;
      return;
    }
    if (!holding.current) progress.set(index);
  }, [index, progress]);

  /** Suelta en `target`: anima hasta allí y, si cambia de pantalla, avisa. */
  const settle = (target: number) => {
    holding.current = false;
    const to = Math.max(0, Math.min(last, target));
    settling.current = to;
    void animate(progress, to, reduceMotion ? { duration: 0 } : SPRING);
    if (to !== index) onIndexChange(to);
    else settling.current = null;
  };

  /** Salta a `target` sin cruzar las pantallas intermedias (un toque en una pestaña). */
  const jump = (target: number) => {
    holding.current = false;
    const to = Math.max(0, Math.min(last, target));
    progress.stop();
    progress.set(to);
    if (to !== index) {
      settling.current = to;
      setMounted((m) => union(m, new Set([to])));
      onIndexChange(to);
    }
  };

  /** Empieza un gesto: se montan las pantallas que pueden asomar (las vecinas). */
  const hold = () => {
    holding.current = true;
    // Un gesto nuevo manda: se para la animación del anterior si aún no ha acabado.
    progress.stop();
    setMounted((m) => union(m, neighbours(index, last)));
  };

  return { count, index, progress, mounted, hold, settle, jump };
}

export type Pager = ReturnType<typeof usePager>;

/** Deslizar en horizontal sobre un contenedor: la pantalla sigue al dedo y entra la vecina. */
export function usePagerSwipe(pager: Pager, width: RefObject<number>) {
  const gesture = useRef<{ id: number; x: number; y: number; lastX: number; lastT: number; decided: "h" | "v" | null } | null>(null);
  const { index, progress, hold, settle, count } = pager;
  const last = count - 1;

  const end = (e: ReactPointerEvent<HTMLElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.decided !== "h" || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    // Velocidad del último tramo: un trazo lento y corto no cambia de pantalla.
    const velocity = (e.clientX - g.lastX) / Math.max(1, performance.now() - g.lastT);
    const w = width.current || window.innerWidth;
    const dir = dx < 0 ? 1 : -1;
    const far = Math.abs(dx) > w * 0.28;
    const flick = Math.abs(velocity) > 0.5 && Math.sign(velocity) === -dir;
    settle(far || flick ? index + dir : index);
  };

  return {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType !== "touch" || index < 0) return;
      const now = performance.now();
      gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, lastX: e.clientX, lastT: now, decided: null };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (!g.decided) {
        if (Math.hypot(dx, dy) < 10) return;
        g.decided = Math.abs(dx) > Math.abs(dy) * 1.3 && !blocksSwipe(e.target, dx) ? "h" : "v";
        if (g.decided === "v") {
          gesture.current = null;
          return;
        }
        hold();
        try {
          // Así el gesto sigue aunque el dedo salga del contenedor.
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* puntero ya liberado: el gesto continúa igualmente */
        }
      }
      const now = performance.now();
      if (now - g.lastT > 40) {
        g.lastX = e.clientX;
        g.lastT = now;
      }
      const w = width.current || window.innerWidth;
      let p = index - dx / w;
      // Más allá de la primera o la última pantalla, resiste como un elástico.
      if (p < 0) p *= 0.25;
      if (p > last) p = last + (p - last) * 0.25;
      progress.set(p);
    },
    onPointerUp: end,
    onPointerCancel: end,
  };
}

/**
 * ¿El gesto empieza en algo que ya se desplaza en horizontal o no admite el
 * deslizamiento? Para excluir un elemento, márcalo con `data-no-swipe`.
 */
function blocksSwipe(target: EventTarget | null, dx: number): boolean {
  for (let el = target as HTMLElement | null; el && el !== document.body; el = el.parentElement) {
    if (el.dataset?.noSwipe !== undefined) return true;
    if (el.scrollWidth > el.clientWidth + 1) {
      const overflow = getComputedStyle(el).overflowX;
      if (overflow === "auto" || overflow === "scroll") {
        // Solo si aún puede desplazarse en esa dirección.
        if (dx < 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1) return true;
        if (dx > 0 && el.scrollLeft > 0) return true;
      }
    }
  }
  return false;
}

/** Las pantallas, colocadas según `progress`. Va dentro de un contenedor `relative` con `overflow: hidden`. */
export function TabPager({ pager, width, screens, fallback = null }: { pager: Pager; width: number; screens: ComponentType[]; fallback?: ReactNode }) {
  return (
    <>
      {screens.map((Screen, i) => (
        <Pane key={i} i={i} progress={pager.progress} active={i === pager.index} width={width}>
          {pager.mounted.has(i) ? (
            <Suspense fallback={fallback}>
              <Screen />
            </Suspense>
          ) : null}
        </Pane>
      ))}
    </>
  );
}

function Pane({ i, progress, active, width, children }: { i: number; progress: MotionValue<number>; active: boolean; width: number; children: ReactNode }) {
  const x = useTransform(progress, (p) => (i - p) * width);
  // Solo se ven la actual y, durante el gesto, la vecina; el resto queda oculto pero montado.
  const visibility = useTransform(progress, (p) => (Math.abs(i - p) < 0.999 ? "visible" : "hidden"));
  return (
    <motion.div className="absolute inset-0 flex flex-col" style={{ x, visibility }} inert={!active} aria-hidden={!active || undefined} data-tab-pane={i}>
      {children}
    </motion.div>
  );
}

/** Ancho de un elemento, al vuelo (`width` para renderizar y `latest` para los gestos). */
export function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);
  const latest = useRef(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      latest.current = el.clientWidth;
      setWidth(el.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return { width, latest };
}

/** Contenedor listo para el paginador: recorta, mide y atiende el deslizamiento. */
export function PagerViewport({ pager, screens, className, style, fallback }: { pager: Pager; screens: ComponentType[]; className?: string; style?: CSSProperties; fallback?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, latest } = useWidth(ref);
  const swipe = usePagerSwipe(pager, latest);
  return (
    <div ref={ref} className={["relative overflow-hidden [touch-action:pan-y_pinch-zoom]", className].filter(Boolean).join(" ")} style={style} {...swipe}>
      <TabPager pager={pager} width={width} screens={screens} fallback={fallback} />
    </div>
  );
}

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

function neighbours(index: number, last: number): Set<number> {
  if (index < 0) return new Set();
  return new Set([index - 1, index, index + 1].filter((i) => i >= 0 && i <= last));
}

function union(a: Set<number>, b: Set<number>): Set<number> {
  let changed = false;
  for (const v of b) if (!a.has(v)) changed = true;
  return changed ? new Set([...a, ...b]) : a;
}
