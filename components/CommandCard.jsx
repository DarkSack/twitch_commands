import { useState } from "react";
import { ejemploNightbot } from "@/commands";

/**
 * Tarjeta de un comando, con botón de copiar el `!addcom`.
 *
 * Copiar es la acción que de verdad se hace aquí: nadie transcribe a mano una
 * URL con `$(urlfetch ...)`. Por eso el botón está en la tarjeta y no
 * escondido detrás de un menú.
 */
export function CommandCard({ comando }) {
  // null = en reposo · "ok" = copiado · "manual" = hay que pulsar Ctrl+C
  const [estado, setEstado] = useState(null);
  const snippet = ejemploNightbot(comando);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(snippet);
      setEstado("ok");
    } catch {
      // El portapapeles necesita contexto seguro y permiso, y en un iframe o
      // sobre http simplemente no está. En ese caso se selecciona el texto y
      // SE DICE, porque seleccionar en silencio parece que el botón no hizo
      // nada. Comprobado: aquí `writeText` falla y este camino se ejecuta.
      const nodo = document.getElementById(`snippet-${comando.name}`);
      if (nodo) {
        const rango = document.createRange();
        rango.selectNodeContents(nodo);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(rango);
      }
      setEstado("manual");
    }
    setTimeout(() => setEstado(null), 2200);
  }

  return (
        // `min-w-0` es imprescindible: un elemento de grid tiene `min-width: auto`
    // por defecto, asi que no puede encogerse por debajo de su contenido. Sin
    // esto, el snippet largo estiraba la columna a 852px dentro de una
    // pantalla de 375 y la pagina entera se iba en scroll horizontal.
    <li className="group flex min-w-0 flex-col gap-3 rounded-tarjeta border border-borde bg-tarjeta p-4 shadow-[var(--sombra)] transition hover:border-acento/60 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="font-mono text-base font-semibold text-acento">
          !{comando.name}
        </h3>
        {comando.params.length > 0 && (
          <span className="font-mono text-xs text-texto-suave">
            {comando.params.join(" ")}
          </span>
        )}
        {comando.estado && (
          <span className="ml-auto rounded-full bg-acento-tenue px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-acento-fuerte uppercase">
            guarda datos
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-texto-suave">
        {comando.description}
      </p>

      <div className="flex items-stretch gap-2">
        {/* Se recorta en vez de dejar barra de scroll: son 27 tarjetas y
            nadie lee la URL entera en pantalla, se copia. El texto completo
            sigue en el DOM para el portapapeles y para los lectores. */}
        <code
          id={`snippet-${comando.name}`}
          title={snippet}
          className="min-w-0 flex-1 truncate rounded-lg bg-fondo-alt px-3 py-2 font-mono text-xs text-texto-suave"
        >
          {snippet}
        </code>
        <button
          type="button"
          onClick={copiar}
          aria-label={`Copiar el comando de ${comando.name}`}
          className={`shrink-0 rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition ${
            estado === "ok"
              ? "border-acento bg-acento-tenue text-acento-fuerte"
              : "border-borde text-texto-suave hover:border-acento hover:text-acento"
          }`}
        >
          {estado === "ok"
            ? "✓ Copiado"
            : estado === "manual"
              ? "Ctrl+C"
              : "Copiar"}
        </button>
      </div>

      {/* `aria-live` para que un lector de pantalla anuncie el resultado: el
          cambio de texto del botón solo lo ve quien mira. */}
      <span aria-live="polite" className="sr-only">
        {estado === "ok"
          ? "Comando copiado al portapapeles"
          : estado === "manual"
            ? "Texto seleccionado, pulsa Control C para copiar"
            : ""}
      </span>
    </li>
  );
}

export default CommandCard;
