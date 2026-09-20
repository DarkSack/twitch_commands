import { useEffect } from "react";

/**
 * Interruptor de tema.
 *
 * El tema real lo aplica el script inline de `_document`, antes de que React
 * exista. Este componente solo lo cambia y lo recuerda.
 *
 * No guarda el tema en estado de React a propósito. El servidor no puede saber
 * qué tema tiene el visitante, así que cualquier estado renderizado arranca
 * equivocado: la versión anterior pintaba el botón vacío y con la etiqueta al
 * revés hasta que el usuario lo pulsaba. Ahora el icono lo elige el CSS con la
 * variante `dark:` —la misma clase del `<html>` que ya manda en el resto de la
 * página— y el botón no depende de haberse hidratado para verse bien.
 */
export function ThemeToggle() {
  // Si el visitante no ha elegido nada, el sitio sigue a su sistema aunque lo
  // cambie con la página abierta.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = (e) => {
      let guardado = null;
      try {
        guardado = localStorage.getItem("tema");
      } catch {
        /* almacenamiento bloqueado: se sigue al sistema */
      }
      if (guardado) return;
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  function alternar() {
    const oscuro = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", oscuro);
    try {
      localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
    } catch {
      /* sin persistencia, pero el cambio de esta sesión funciona */
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Cambiar entre tema claro y oscuro"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-tarjeta text-texto-suave transition hover:border-acento hover:text-acento"
    >
      <span aria-hidden="true" className="hidden text-lg leading-none dark:inline">
        ☀️
      </span>
      <span aria-hidden="true" className="text-lg leading-none dark:hidden">
        🌙
      </span>
    </button>
  );
}

export default ThemeToggle;
