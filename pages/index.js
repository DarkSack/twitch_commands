import Head from "next/head";
import { useMemo, useState } from "react";
import { comandosPublicos, porGrupo } from "@/commands";
import { CommandCard } from "@/components/CommandCard";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Portada.
 *
 * Sólo se pintan los comandos PÚBLICOS, que son los que no tocan la base de
 * datos. Los de economía existen y funcionan, pero se documentan únicamente en
 * el README del repositorio: anunciarlos aquí invita a que gente que no es del
 * canal se ponga a crear usuarios y mover monedas.
 *
 * Con 40 comandos, la lista plana obligaba a buscar con Ctrl+F. Ahora van por
 * grupos, con buscador y filtro, que es lo que se hace de verdad al llegar
 * ("¿tenéis algo para el chat?", "¿cómo se llamaba el de los dados?").
 *
 * El filtrado va en el cliente sin ningún efecto: los datos son estáticos y
 * caben de sobra en memoria. Derivarlo con `useMemo` evita tanto una petición
 * como un `useEffect` innecesario.
 */

/** Quita acentos para que "matematicas" encuentre "matemáticas". */
function normalizar(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function Home() {
  const [busqueda, setBusqueda] = useState("");
  const [grupo, setGrupo] = useState("todos");

  const grupos = useMemo(() => porGrupo(), []);

  const secciones = useMemo(() => {
    const q = normalizar(busqueda.trim());

    return grupos
      .filter((g) => grupo === "todos" || g.id === grupo)
      .map((g) => ({
        ...g,
        comandos: q
          ? g.comandos.filter((c) =>
              normalizar(`${c.name} ${c.description}`).includes(q)
            )
          : g.comandos,
      }))
      .filter((g) => g.comandos.length > 0);
  }, [busqueda, grupo, grupos]);

  const encontrados = secciones.reduce((s, g) => s + g.comandos.length, 0);

  return (
    <>
      <Head>
        <title>Comandos para bots de Twitch</title>
        <meta
          name="description"
          content={`${comandosPublicos.length} endpoints HTTP listos para Nightbot, StreamElements y Botrix. Copia y pega.`}
        />
      </Head>

      <div className="min-h-screen bg-fondo">
        <header className="sticky top-0 z-10 border-b border-borde bg-fondo/85 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
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

        <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <section className="py-10 sm:py-14">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Comandos listos para tu chat
            </h1>
            <p className="mt-3 max-w-prose text-base leading-relaxed text-texto-suave">
              Endpoints HTTP para Nightbot, StreamElements y Botrix. Copia el
              comando, pégalo en tu bot y ya funciona. Sin instalar nada.
            </p>
            <p className="mt-4 text-sm text-texto-suave">
              <span className="font-semibold text-texto">
                {comandosPublicos.length}
              </span>{" "}
              comandos ·{" "}
              <span className="font-semibold text-texto">{grupos.length}</span>{" "}
              grupos · ninguno guarda datos tuyos
            </p>
          </section>

          {/* El buscador y los filtros van pegados arriba: con siete grupos,
              tener que subir hasta la cabecera para cambiar de filtro
              convierte la página en un ascensor. */}
          <div className="sticky top-[57px] z-[5] -mx-4 bg-fondo/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <label htmlFor="buscar" className="sr-only">
              Buscar comando
            </label>
            <input
              id="buscar"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar: dado, morse, abrazo…"
              className="w-full rounded-tarjeta border border-borde bg-tarjeta px-4 py-2.5 text-sm placeholder:text-texto-suave/70 focus:border-acento focus:outline-none"
            />

            {/* Scroll horizontal en móvil en vez de que los ocho botones se
                apilen en cuatro filas y empujen las tarjetas fuera de vista. */}
            <div
              role="tablist"
              aria-label="Filtrar por grupo"
              className="mt-2 flex gap-1.5 overflow-x-auto pb-1"
            >
              <BotonGrupo
                activo={grupo === "todos"}
                onClick={() => setGrupo("todos")}
              >
                Todos
              </BotonGrupo>
              {grupos.map((g) => (
                <BotonGrupo
                  key={g.id}
                  activo={grupo === g.id}
                  onClick={() => setGrupo(g.id)}
                >
                  <span aria-hidden="true">{g.emoji}</span> {g.etiqueta}
                </BotonGrupo>
              ))}
            </div>
          </div>

          {/* Los lectores de pantalla no ven desaparecer tarjetas: hay que
              decirles cuántas quedan. */}
          <p aria-live="polite" className="sr-only">
            {encontrados} comandos encontrados
          </p>

          {secciones.length === 0 ? (
            <p className="mt-10 rounded-tarjeta border border-dashed border-borde px-4 py-10 text-center text-sm text-texto-suave">
              Ningún comando coincide con «{busqueda}».
            </p>
          ) : (
            secciones.map((g) => (
              <section key={g.id} className="mt-8 first:mt-6">
                <h2 className="flex items-baseline gap-2 text-sm font-semibold tracking-wide text-texto-suave uppercase">
                  <span aria-hidden="true" className="text-base">
                    {g.emoji}
                  </span>
                  {g.etiqueta}
                  <span className="font-normal normal-case">
                    · {g.comandos.length}
                  </span>
                </h2>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {g.comandos.map((c) => (
                    <CommandCard key={c.name} comando={c} />
                  ))}
                </ul>
              </section>
            ))
          )}

          <section className="mt-14 grid gap-3 sm:grid-cols-2">
            <div className="rounded-tarjeta border border-borde bg-tarjeta p-5 sm:p-6">
              <h2 className="font-semibold">Cómo se usa</h2>
              <ol className="mt-3 flex flex-col gap-2 text-sm text-texto-suave">
                <li>
                  <span className="font-medium text-texto">1.</span> Copia el
                  comando de la tarjeta que te interese.
                </li>
                <li>
                  <span className="font-medium text-texto">2.</span> Pégalo en
                  el chat de tu canal con el bot conectado.
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
            </div>

            <div className="rounded-tarjeta border border-borde bg-tarjeta p-5 sm:p-6">
              <h2 className="font-semibold">¿Y la economía del canal?</h2>
              <p className="mt-3 text-sm leading-relaxed text-texto-suave">
                Hay otro juego de comandos —monedas, inventario, duelos,
                mercado— que sí guarda datos. Ésos no se listan aquí: van
                documentados sólo en el repositorio, para no invitar a que gente
                de fuera del canal llene la base de datos.
              </p>
              <a
                className="mt-4 inline-block text-sm text-acento underline underline-offset-4"
                href="https://github.com/DarkSack/twitch_commands#comandos-con-estado"
                target="_blank"
                rel="noreferrer"
              >
                Verlos en GitHub →
              </a>
            </div>
          </section>
        </main>

        <footer className="border-t border-borde">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-texto-suave sm:px-6">
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

function BotonGrupo({ activo, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activo}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition ${
        activo
          ? "border-acento bg-acento text-acento-texto"
          : "border-borde bg-tarjeta text-texto-suave hover:border-acento hover:text-acento"
      }`}
    >
      {children}
    </button>
  );
}
