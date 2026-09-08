/**
 * Configuración de Tailwind.
 *
 * Antes envolvía todo en `keepTheme()` de keep-react, una librería de
 * componentes que no se usa en ningún fichero del proyecto: ni un import, ni
 * un componente. Se ha quitado junto con el `@import "keep-react/css"` de
 * globals.css.
 *
 * `content` tampoco apuntaba a donde está el código: listaba `./app/**`, que
 * no existe —esto es Pages Router—, y se dejaba fuera `./pages/**`, que es
 * donde vive la portada. Con eso, Tailwind no veía ninguna clase de las
 * páginas y podía purgarlas.
 */
const config = {
  // Ya no hay `components/`: el escaparate se separó a twitch-commands-web y
  // aquí sólo queda la portada mínima que apunta a él.
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {},
};

export default config;
