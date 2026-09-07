import { useEffect, useState } from "react";

/**
 * Interruptor de tema.
 *
 * El tema real lo aplica el script inline de `_document`, antes de que React
 * exista. Este componente solo lo cambia y lo recuerda.
 *
 * Arranca en `null` y no pinta el icono hasta montarse: en el servidor no hay
 * forma de saber qué tema tiene el visitante, así que renderizar uno concreto
 * garantizaría un desajuste de hidratación y, peor, un icono que parpadea al
 * corregirse.
 */
export function ThemeToggle() {
  const [oscuro, setOscuro] = useState(null);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

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
      setOscuro(e.matches);
    };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  function alternar() {
    const nuevo = !oscuro;
    document.documentElement.classList.toggle("dark", nuevo);
    setOscuro(nuevo);
    try {
      localStorage.setItem("tema", nuevo ? "oscuro" : "claro");
    } catch {
      /* sin persistencia, pero el cambio de esta sesión funciona */
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      aria-pressed={oscuro ?? false}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-borde bg-tarjeta text-texto-suave transition hover:border-acento hover:text-acento"
    >
      {/* Sin tema conocido todavía, se reserva el hueco para que la cabecera
          no dé un salto al montarse. */}
      <span aria-hidden="true" className="text-lg leading-none">
        {oscuro === null ? "" : oscuro ? "☀️" : "🌙"}
      </span>
    </button>
  );
}

export default ThemeToggle;
