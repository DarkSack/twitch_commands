import { Html, Head, Main, NextScript } from "next/document";

/**
 * El script del tema va INLINE y antes del contenido a propósito.
 *
 * Si se aplicara desde React, el navegador pintaría primero el tema claro y
 * después saltaría al oscuro: el destello blanco clásico. Ejecutándolo aquí,
 * la clase ya está puesta cuando se pinta el primer píxel.
 *
 * Es deliberadamente pequeño y sin dependencias. Si `localStorage` está
 * bloqueado (modo incógnito estricto, cookies desactivadas) el try/catch deja
 * caer la decisión en la preferencia del sistema en lugar de romper la página.
 */
const SCRIPT_TEMA = `
(function () {
  try {
    var guardado = localStorage.getItem("tema");
    var oscuro = guardado
      ? guardado === "oscuro"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", oscuro);
  } catch (e) {
    document.documentElement.classList.toggle(
      "dark",
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
})();
`;

export default function Document() {
  // El sitio está en español: `lang="en"` hacía que los lectores de pantalla
  // leyeran el texto con fonética inglesa.
  return (
    <Html lang="es" suppressHydrationWarning>
      <Head>
        <meta
          name="description"
          content="Endpoints HTTP listos para comandos de bot en Twitch: Nightbot, StreamElements y Botrix."
        />
        <meta name="theme-color" content="#7c3aed" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
