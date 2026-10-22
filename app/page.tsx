import { Demo } from "./demo";

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:flex-row md:items-start md:gap-14 md:py-16">
      <section className="flex flex-col gap-5 md:sticky md:top-16 md:w-80">
        <div>
          <p className="text-sm font-semibold text-accent">daniblanco-ui</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Tab Bar líquida</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Barra de pestañas al estilo de iOS 27. La lente se arrastra por la barra, se estira con la velocidad, tiñe solo lo que cubre y se imanta a la
            pestaña más cercana al soltarla. Desliza las pantallas con el dedo y la lente las acompaña.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-[13px]">
          <p className="font-semibold">Instalar con shadcn</p>
          {["tab-bar", "jelly-button", "tab-pager", "tab-shell"].map((name) => (
            <code key={name} className="break-all rounded-lg bg-card px-3 py-2 font-mono text-[12px]">
              npx shadcn add {"<registro>"}/r/{name}.json
            </code>
          ))}
        </div>
      </section>
      <Demo />
    </main>
  );
}
