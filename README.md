# daniblanco-ui

Componentes de interfaz reutilizables de Dani Blanco, distribuidos como un
**registro de shadcn**: al instalarlos, el código se copia dentro de tu proyecto
(no es una dependencia de npm), así que cada app puede retocarlos libremente.

| Componente     | Qué es                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------ |
| `tab-bar`      | Barra de pestañas estilo iOS 27 con una lente líquida que se arrastra y se imanta.          |
| `jelly-button` | Botón redondo flotante que se aplasta al pulsarlo y rebota (p. ej. el «+» junto a la barra). |
| `tab-pager`    | Pantallas que se pasan deslizando con el dedo, enlazables a la barra. Sin enrutador.        |
| `tab-shell`    | Barra + paginador unidos a las rutas de Next.js (cada pestaña es una ruta).                 |

Requisitos: React 19, Tailwind CSS v4 y `motion`. `tab-shell` necesita Next.js
(App Router).

## Instalar

```bash
npx shadcn add https://raw.githubusercontent.com/dblancoramirez/daniblanco-ui/main/public/r/tab-bar.json
```

Igual con `jelly-button`, `tab-pager` o `tab-shell` (este último trae también
`tab-bar` y `tab-pager`). Los archivos quedan en `components/daniblanco-ui/` y
los colores se añaden a tu `globals.css` como variables `--dbui-*`.

También se puede instalar desde una copia local del repositorio:

```bash
npx shadcn add ../daniblanco-ui/public/r/tab-bar.json
```

## Uso

### Solo la barra

```tsx
const [tab, setTab] = useState(0);

<TabBar
  items={[
    { label: "Inicio", icon: HouseSimpleIcon },
    { label: "Buscar", icon: MagnifyingGlassIcon },
  ]}
  value={tab}
  onValueChange={setTab}
  trailing={<JellyButton aria-label="Añadir" onClick={add} />}
/>
```

### Barra + pantallas deslizables (sin enrutador)

```tsx
const [index, setIndex] = useState(0);
const pager = usePager({ count: 3, index, onIndexChange: setIndex });

<PagerViewport pager={pager} screens={[Uno, Dos, Tres]} className="h-dvh" />
<TabBar items={items} value={index} progress={pager.progress} onValueChange={pager.jump} />
```

`progress` es la posición continua que comparten la barra y las pantallas: al
deslizar con el dedo la lente acompaña al gesto.

### Con las rutas de Next.js

```tsx
const TABS: TabShellItem[] = [
  { href: "/app", label: "Inicio", icon: HouseSimpleIcon, exact: true },
  { href: "/app/movimientos", label: "Movimientos", icon: ListBulletsIcon },
];

<div className="fixed inset-0 flex flex-col">
  <TabShell items={TABS} screens={[Inicio, Movimientos]} bar={{ trailing: <JellyButton /> }}>
    {children /* rutas que no son pestañas: la barra se oculta */}
  </TabShell>
</div>
```

Al final del contenido con scroll de cada pantalla pon `<TabBarSpacer />` para
que lo último no quede debajo de la barra.

## Opciones

### `TabBar`

| Prop            | Tipo                           | Por defecto   | Descripción                                                     |
| --------------- | ------------------------------ | ------------- | --------------------------------------------------------------- |
| `items`         | `{ label, icon?, href? }[]`    | —             | Pestañas. El icono recibe `weight="fill"` dentro de la lente.    |
| `value`         | `number`                       | —             | Pestaña activa; `-1` oculta la lente.                           |
| `onValueChange` | `(index) => void`              | —             | Al tocar una pestaña o soltar la lente.                         |
| `progress`      | `MotionValue<number>`          | —             | Posición continua de un paginador.                              |
| `trailing`      | `ReactNode`                    | —             | Lo que va a la derecha de la cápsula (un botón, un avatar…).    |
| `leading`       | `ReactNode`                    | —             | Lo que va a la izquierda.                                       |
| `position`      | `"fixed" \| "static"`          | `"fixed"`     | Pegada al borde inferior (con área segura) o donde la pongas.   |
| `height`        | `number`                       | `62`          | Alto de la cápsula.                                             |
| `showLabels`    | `boolean`                      | `true`        | Textos bajo los iconos (si no, pasan a `aria-label`).           |
| `liquid`        | `boolean`                      | `true`        | Efecto gota: crece al pulsar y se estira al moverse.            |
| `aria-label`    | `string`                       | `"Secciones"` | Nombre de la navegación.                                        |

### `JellyButton`

Acepta todo lo de un `<button>` (de `motion`) más `size` (diámetro, `62`) y
`squash` (cuánto se aplasta, `0.3`). Sin `children` muestra un «+».

### `usePager`

`{ count, index, onIndexChange, eager? }` → `{ progress, index, mounted, jump, settle, hold }`.
Las pantallas se montan al visitarlas (o todas con `eager`) y se conservan con
su scroll. Para que un elemento no inicie el deslizamiento, márcalo con
`data-no-swipe`; los que ya se desplazan en horizontal se respetan solos.

## Colores

| Variable                 | Uso                              |
| ------------------------ | -------------------------------- |
| `--dbui-accent`          | Pestaña activa y fondo del botón |
| `--dbui-accent-contrast` | Contenido del botón              |
| `--dbui-accent-glow`     | Sombra de color del botón        |
| `--dbui-label`           | Pestañas inactivas               |
| `--dbui-glass`           | Fondo de la cápsula              |
| `--dbui-lens`            | Lente en reposo                  |
| `--dbui-border`          | Borde de la cápsula              |
| `--dbui-shadow`          | Sombra de la cápsula             |

Para usar los colores de tu app, apúntalas a tus variables:
`--dbui-accent: var(--accent);`.

## Decisiones de diseño

- **La lente no arrastra las pantallas.** Al moverla por la barra solo se mueve
  ella; al soltarla se imanta a la pestaña más cercana y esa pantalla aparece
  directamente. Deslizar sobre el contenido sí mueve las pantallas, y entonces
  la lente las sigue.
- **Teñido recortado.** Las pestañas se dibujan dos veces: en color de acento
  recortadas a la forma de la lente (`clip-path: inset`) y normales con la forma
  de la lente vaciada (`clip-path: path(evenodd)`). Así el color entra por el
  lado por donde llega la lente y no asoman los trazos del icono normal por los
  huecos del relleno.
- **Gota.** La lente crece un 14 % al pulsarla, pasa a cristal claro y se
  estira a lo ancho (y se aplana) según su velocidad; al soltar vuelve con un
  muelle con rebote.
- **Toda la cápsula responde.** El toque se gestiona en la cápsula entera, así
  que también funciona entre pestañas; los enlaces quedan para el teclado y los
  lectores de pantalla.
- **Movimiento reducido.** Con `prefers-reduced-motion` desaparecen la gota y
  las animaciones del botón.

## Desarrollo

```bash
npm run dev             # demo en http://localhost:3000
npm run registry:build  # regenera public/r/*.json desde registry.json
```

El código fuente de cada componente está en `registry/daniblanco-ui/`. Después
de cambiarlo, ejecuta `npm run registry:build` y sube los cambios.
