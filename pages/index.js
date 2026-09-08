import Head from "next/head";
import { BASE_URL, comandosPublicos } from "@/commands";

/**
 * Portada mínima de la API.
 *
 * El escaparate de comandos se separó a su propio proyecto
 * (comandos.sackito.online) para que la web y los endpoints se desplieguen por
 * separado. Aquí se deja sólo un cartel: quien llegue a este dominio por
 * curiosidad merece saber dónde está lo que buscaba, y quien llegue por error
 * no se encuentra un 404 sin explicación.
 */
const WEB = "https://comandos.sackito.online";

export default function Home() {
  return (
    <>
      <Head>
        <title>API de comandos para Twitch</title>
        <meta
          name="description"
          content={`${comandosPublicos.length} endpoints HTTP para Nightbot, StreamElements y Botrix.`}
        />
        {/* No tiene sentido que esto compita en buscadores con la portada. */}
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={WEB} />
      </Head>

      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 px-6 py-16 text-texto">
        <h1 className="text-2xl font-bold tracking-tight">
          API de comandos para Twitch
        </h1>

        <p className="leading-relaxed text-texto-suave">
          Esto es sólo la API: {comandosPublicos.length} endpoints HTTP que
          responden con una línea de texto, pensados para que los llame
          Nightbot, StreamElements o Botrix.
        </p>

        <p className="leading-relaxed text-texto-suave">
          La lista completa, con el comando listo para copiar, está en{" "}
          <a className="text-acento underline underline-offset-4" href={WEB}>
            comandos.sackito.online
          </a>
          .
        </p>

        <div className="rounded-tarjeta border border-borde bg-tarjeta p-5">
          <p className="text-sm font-semibold">Probar uno</p>
          <code className="mt-2 block overflow-x-auto rounded-lg bg-fondo-alt px-3 py-2 font-mono text-xs text-texto-suave">
            {BASE_URL}/api/dado?tirada=2d6%2B3
          </code>
          <p className="mt-3 text-sm text-texto-suave">
            El catálogo en JSON está en{" "}
            {/* Absoluta a propósito: es una ruta de API, no una página, y el
                linter de Next exige `<Link>` para cualquier href interno. */}
            <a
              className="text-acento underline underline-offset-4"
              href={`${BASE_URL}/api/comandos.json`}
            >
              /api/comandos.json
            </a>
            .
          </p>
        </div>

        <p className="text-sm text-texto-suave">
          Código en{" "}
          <a
            className="text-acento underline underline-offset-4"
            href="https://github.com/DarkSack/twitch_commands"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </main>
    </>
  );
}
