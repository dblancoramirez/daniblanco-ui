"use client";

import type { ReactNode } from "react";
import { JellyButton } from "./jelly-button";
import { TabShell, type TabShellProps } from "./tab-shell";

/**
 * daniblanco-ui · IOSTabBar (Next.js)
 *
 * La barra inferior de iOS completa en un solo componente: pestañas enlazadas a
 * las rutas, pantallas que se pasan deslizando, la lente líquida y, si se pasa
 * `onAdd`, el botón «+» flotante a la derecha. Para algo distinto, las piezas
 * (TabBar, TabPager, TabShell, JellyButton) se pueden usar por separado.
 *
 * Va dentro de un contenedor de alto completo en columna, p. ej.
 * `<div className="fixed inset-0 flex flex-col">`.
 */

export interface IOSTabBarProps extends TabShellProps {
  /** Muestra el botón flotante a la derecha y lo llama al pulsarlo. */
  onAdd?: () => void;
  /** Nombre accesible del botón. */
  addLabel?: string;
  /** Contenido del botón (por defecto, un «+»). */
  addIcon?: ReactNode;
}

export function IOSTabBar({ onAdd, addLabel = "Añadir", addIcon, bar, ...shell }: IOSTabBarProps) {
  const trailing =
    bar?.trailing ??
    (onAdd ? (
      <JellyButton aria-label={addLabel} onClick={() => onAdd()}>
        {addIcon}
      </JellyButton>
    ) : undefined);
  return <TabShell {...shell} bar={{ ...bar, trailing }} />;
}
