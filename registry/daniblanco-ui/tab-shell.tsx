"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, type ComponentType, type ReactNode } from "react";
import { TabBar, type TabBarItem, type TabBarProps } from "./tab-bar";
import { TabPager, usePager, usePagerSwipe, useWidth, type Pager } from "./tab-pager";

/**
 * daniblanco-ui · TabShell (Next.js)
 *
 * Une la TabBar y el TabPager con las rutas: cada pestaña es una ruta y su
 * pantalla, y se pasa de una a otra deslizando o con la barra. En las rutas que
 * no son pestañas (p. ej. ajustes) muestra `children` y oculta la barra.
 */

export interface TabShellItem extends TabBarItem {
  href: string;
  /** Activa solo con la ruta exacta (útil para la raíz, p. ej. "/app"). Si no, también en sus subrutas. */
  exact?: boolean;
}

export function matchTab(pathname: string, item: TabShellItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/** Pestaña de la ruta actual, enlazada a un paginador; -1 fuera de las pestañas. */
export function useRouteTabs(items: TabShellItem[]): Pager {
  const pathname = usePathname();
  const router = useRouter();
  return usePager({
    count: items.length,
    index: items.findIndex((item) => matchTab(pathname, item)),
    onIndexChange: (i) => router.push(items[i].href),
  });
}

export interface TabShellProps {
  items: TabShellItem[];
  /** Una pantalla por pestaña, en el mismo orden. */
  screens: ComponentType[];
  /** Lo que se muestra en las rutas que no son pestañas. */
  children?: ReactNode;
  /** Clases del contenedor de las pantallas (un `<main>`). */
  className?: string;
  /** Resto de opciones de la barra (trailing, leading, height, showLabels…). */
  bar?: Omit<TabBarProps, "items" | "value" | "onValueChange" | "progress">;
  /** Paginador propio (si se necesita fuera); por defecto se crea uno con las rutas. */
  pager?: Pager;
}

export function TabShell({ items, screens, children, className, bar, pager: external }: TabShellProps) {
  const own = useRouteTabs(items);
  const pager = external ?? own;
  const main = useRef<HTMLElement>(null);
  const { width, latest } = useWidth(main);
  const swipe = usePagerSwipe(pager, latest);
  const inTabs = pager.index >= 0;
  return (
    <>
      <main
        ref={main}
        className={["relative flex min-h-0 flex-1 flex-col overflow-hidden [touch-action:pan-y_pinch-zoom]", className].filter(Boolean).join(" ")}
        {...(inTabs ? swipe : {})}
      >
        {inTabs ? <TabPager pager={pager} width={width} screens={screens} /> : children}
      </main>
      {inTabs && <TabBar {...bar} items={items} value={pager.index} progress={pager.progress} onValueChange={pager.jump} />}
    </>
  );
}
