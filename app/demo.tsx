"use client";

import { CalendarDotsIcon, ChartPieSliceIcon, GearSixIcon, HouseSimpleIcon, ListBulletsIcon, PlusIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { TabBar, type TabBarItem } from "@/registry/daniblanco-ui/tab-bar";
import { JellyButton } from "@/registry/daniblanco-ui/jelly-button";
import { PagerViewport, usePager } from "@/registry/daniblanco-ui/tab-pager";

const ALL: TabBarItem[] = [
  { label: "Inicio", icon: HouseSimpleIcon },
  { label: "Movimientos", icon: ListBulletsIcon },
  { label: "Estadísticas", icon: ChartPieSliceIcon },
  { label: "Planificación", icon: CalendarDotsIcon },
  { label: "Ajustes", icon: GearSixIcon },
];

function screen(title: string, hue: number): ComponentType {
  function Screen() {
    return (
      <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 pb-28 pt-6 [scrollbar-width:none]">
        <h2 className="text-[28px] font-bold tracking-tight">{title}</h2>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className="size-10 shrink-0 rounded-xl" style={{ background: `hsl(${hue} 70% 60% / ${0.35 + i * 0.07})` }} />
            <div className="flex-1">
              <div className="h-3 w-2/3 rounded-full bg-current opacity-15" />
              <div className="mt-2 h-2.5 w-1/3 rounded-full bg-current opacity-10" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return Screen;
}

const SCREENS = ALL.map((item, i) => screen(item.label, 240 + i * 40));

export function Demo() {
  const [count, setCount] = useState(4);
  const [showLabels, setShowLabels] = useState(true);
  const [liquid, setLiquid] = useState(true);
  const [withButton, setWithButton] = useState(true);
  const [index, setIndex] = useState(0);
  const items = ALL.slice(0, count);
  const current = Math.min(index, count - 1);
  const pager = usePager({ count, index: current, onIndexChange: setIndex });
  const [taps, setTaps] = useState(0);

  return (
    <section className="flex flex-1 flex-col items-center gap-6">
      {/* Marco de móvil: las pantallas deslizan con el dedo y la barra las sigue. */}
      <div className="relative h-[700px] w-full max-w-[390px] overflow-hidden rounded-[44px] border border-black/10 bg-background shadow-2xl dark:border-white/10">
        <div className="absolute inset-0">
          <PagerViewport key={count} pager={pager} screens={SCREENS.slice(0, count)} className="h-full" />
        </div>
        <TabBar
          key={`bar-${count}`}
          items={items}
          value={current}
          progress={pager.progress}
          onValueChange={pager.jump}
          position="static"
          showLabels={showLabels}
          liquid={liquid}
          className="pointer-events-none absolute inset-x-4 bottom-4"
          trailing={
            withButton ? (
              <JellyButton aria-label="Añadir" onClick={() => setTaps((n) => n + 1)}>
                <PlusIcon size={28} weight="bold" />
              </JellyButton>
            ) : undefined
          }
        />
      </div>
      <div className="flex w-full max-w-[390px] flex-wrap items-center gap-2 text-[13px]">
        {[3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setCount(n)} className={`rounded-full px-3 py-1.5 font-medium ${n === count ? "bg-accent text-white" : "bg-card"}`}>
            {n} pestañas
          </button>
        ))}
        <Toggle on={showLabels} set={setShowLabels} label="Textos" />
        <Toggle on={liquid} set={setLiquid} label="Efecto gota" />
        <Toggle on={withButton} set={setWithButton} label="Botón" />
        {withButton && <span className="text-muted">Pulsado {taps} veces</span>}
      </div>
    </section>
  );
}

function Toggle({ on, set, label }: { on: boolean; set: (on: boolean) => void; label: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => set(!on)} className={`rounded-full px-3 py-1.5 font-medium ${on ? "bg-accent text-white" : "bg-card"}`}>
      {label}
    </button>
  );
}
