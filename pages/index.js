import { comandos, ejemploNightbot } from "@/commands";

/**
 * Portada: la lista de comandos, sacada del mismo catálogo que sirve
 * `/api/comandos`. Así no hay dos verdades que se puedan desincronizar.
 *
 * De lo que había antes se quitó: un `next/image` a un CDN externo que no
 * estaba declarado en `remotePatterns` y por tanto no cargaba, un `<center>`
 * con atributos `bg` y `p` que no existen en el DOM, y dos "COOLABORAR".
 */
export default function Home() {
  const sinEstado = comandos.filter((c) => !c.estado);
  const conEstado = comandos.filter((c) => c.estado);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Comandos para bots de Twitch</h1>
      <p className="mt-2 text-sm opacity-70">
        Endpoints HTTP para Nightbot, StreamElements y Botrix. El bot llama, la
        respuesta llega en texto plano y va directa al chat.
      </p>

      <Seccion
        titulo="Sin estado"
        nota="Funcionan en cualquier sitio, no tocan la base de datos."
        lista={sinEstado}
      />
      <Seccion
        titulo="Con estado"
        nota="Guardan monedas, inventario y estadísticas."
        lista={conEstado}
      />

      <p className="mt-10 text-sm opacity-70">
        ¿Falta algo?{" "}
        <a
          className="underline underline-offset-4"
          href="https://github.com/DarkSack/twitch_commands"
          target="_blank"
          rel="noreferrer"
        >
          Colabora en GitHub
        </a>
        .
      </p>
    </main>
  );
}

function Seccion({ titulo, nota, lista }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <p className="mb-4 text-xs opacity-60">{nota}</p>

      <ul className="flex flex-col gap-4">
        {lista.map((c) => (
          <li key={c.name} className="border-l-2 border-current/20 pl-4">
            <p className="font-mono text-sm font-semibold">
              !{c.name}
              {c.params.length > 0 && (
                <span className="ml-2 font-normal opacity-50">
                  {c.params.join(" ")}
                </span>
              )}
            </p>
            <p className="text-sm opacity-80">{c.description}</p>
            <code className="mt-1 block overflow-x-auto text-xs opacity-50">
              {ejemploNightbot(c)}
            </code>
          </li>
        ))}
      </ul>
    </section>
  );
}
