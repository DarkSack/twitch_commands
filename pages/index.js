import Head from "next/head";
import { useMemo, useState } from "react";
import { comandos } from "@/commands";
import { CommandCard } from "@/components/CommandCard";
import { ThemeToggle } from "@/components/ThemeToggle";

const FILTROS = [
  { id: "todos", etiqueta: "Todos" },
  { id: "sin", etiqueta: "Sin estado" },
  { id: "con", etiqueta: "Con estado" },
];

/**
 * Portada.
 *
 * La lista sale de `commands/index.js`, la misma que sirve `/api/comandos`.
 * Con 27 comandos, una lista plana obliga a buscar con Ctrl+F, así que hay
 * buscador y filtro por tipo: es lo que se hace de verdad al llegar aquí
 * ("¿tenéis algo de economía?", "¿cómo se llamaba el de los dados?").
 *
 * El filtrado va en el cliente sin ningún efecto: los datos son estáticos y
 * caben de sobra en memoria. Guardarlo en estado y derivar la lista con
 * `useMemo` evita tanto una petición como un `useEffect` innecesario.
 */
export default function Home() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const visibles = useMemo(() => {
    const q = busqueda
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

    return comandos.filter((c) => {
      if (filtro === "sin" && c.estado) return false;
      if (filtro === "con" && !c.estado) return false;
      if (!q) return true;

      const texto = `${c.name} ${c.description}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
      return texto.includes(q);
    });
  }, [busqueda, filtro]);

  return (
    <>
      <Head>
        <title>Comandos para bots de Twitch</title>
      </Head>

      <div className="min-h-screen bg-fondo">
        <header className="sticky top-0 z-10 border-b border-borde bg-fondo/85 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
            <span aria-hidden="true" className="text-xl">
              🎮
            </span>
            <p className="min-w-0 flex-1 truncate font-semibold">
              Comandos para Twitch
            </p>
            <a
              href="https://github.com/DarkSack/twitch_commands"
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm text-texto-suave transition hover:text-acento sm:inline"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
          <section className="py-10 sm:py-14">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Comandos listos para tu chat
            </h1>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-texto-suave">
              Endpoints HTTP para Nightbot, StreamElements y Botrix. Copia el
              comando, pégalo en tu bot y ya funciona. Sin instalar nada.
            </p>
            <p className="mt-4 text-sm text-texto-suave">
              <span className="font-semibold text-texto">{comandos.length}</span>{" "}
              comandos ·{" "}
              <span className="font-semibold text-texto">
                {comandos.filter((c) => c.estado).length}
              </span>{" "}
              con economía y equipo
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="buscar" className="sr-only">
                Buscar comando
              </label>
              <input
                id="buscar"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar: dado, monedas, duelo…"
                className="w-full rounded-tarjeta border border-borde bg-tarjeta px-4 py-2.5 text-sm placeholder:text-texto-suave/70 focus:border-acento focus:outline-none"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filtrar comandos"
              className="flex gap-1 rounded-tarjeta border border-borde bg-tarjeta p-1"
            >
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition ${
                    filtro === f.id
                      ? "bg-acento text-acento-texto"
                      : "text-texto-suave hover:text-texto"
                  }`}
                >
                  {f.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {visibles.length === 0 ? (
            <p className="mt-10 rounded-tarjeta border border-dashed border-borde px-4 py-10 text-center text-sm text-texto-suave">
              Ningún comando coincide con «{busqueda}».
            </p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {visibles.map((c) => (
                <CommandCard key={c.name} comando={c} />
              ))}
            </ul>
          )}

          <section className="mt-14 rounded-tarjeta border border-borde bg-tarjeta p-5 sm:p-6">
            <h2 className="font-semibold">Cómo se usa</h2>
            <ol className="mt-3 flex flex-col gap-2 text-sm text-texto-suave">
              <li>
                <span className="font-medium text-texto">1.</span> Copia el
                comando de la tarjeta que te interese.
              </li>
              <li>
                <span className="font-medium text-texto">2.</span> Pégalo en el
                chat de tu canal con el bot conectado.
              </li>
              <li>
                <span className="font-medium text-texto">3.</span> Escribe
                <code className="mx-1 rounded bg-fondo-alt px-1.5 py-0.5 font-mono text-xs">
                  !comando
                </code>
                y listo.
              </li>
            </ol>
            <p className="mt-4 text-sm text-texto-suave">
              Los ejemplos son para Nightbot. StreamElements y Botrix usan la
              misma URL cambiando la sintaxis de variables; están en el{" "}
              <a
                className="text-acento underline underline-offset-4"
                href="https://github.com/DarkSack/twitch_commands#cómo-integrar-en-tu-bot"
                target="_blank"
                rel="noreferrer"
              >
                README
              </a>
              .
            </p>
          </section>
        </main>

        <footer className="border-t border-borde">
          <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-texto-suave sm:px-6">
            Hecho por{" "}
            <a
              className="text-acento underline underline-offset-4"
              href="https://github.com/DarkSack"
              target="_blank"
              rel="noreferrer"
            >
              Sack
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
