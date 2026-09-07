import { Grid } from "@/components/ui/Grid";

/**
 * Portada.
 *
 * Tenia tres cosas rotas:
 *
 * 1. Un `next/image` apuntando a un CDN externo (staticmania/prismic) que no
 *    estaba declarado en `images.remotePatterns` de next.config. La imagen no
 *    cargaba — comprobado en el navegador: `naturalWidth` en 0. Se quita: era
 *    un adorno de plantilla, ajeno al proyecto, y una dependencia de un CDN
 *    de terceros para un banner no se paga sola.
 * 2. `<center bg="primary.400" p="20">`. `center` esta obsoleto desde HTML4 y
 *    `bg`/`p` no son atributos del DOM: React los pasa al elemento y el
 *    navegador avisa por consola. Eran props de una libreria de componentes
 *    que aqui no se usa.
 * 3. "COOLABORANDO" y "COOLABORAR", con dos oes.
 *
 * `handleCopy` tambien sobraba: estaba declarada y no la llamaba nadie.
 */
export default function Home() {
  return (
    <Grid>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">Comandos para bots de Twitch</h1>

        <p className="text-sm opacity-80">
          Endpoints HTTP para Nightbot, StreamElements y Botrix. Estamos
          trabajando aquí: puedes ayudarnos colaborando.
        </p>

        <a
          className="underline underline-offset-4"
          href="https://github.com/DarkSack/twitch_commands"
          target="_blank"
          rel="noreferrer"
        >
          ⚒️ Colaborar en GitHub 🛠️
        </a>

        <p className="text-sm opacity-60">Gracias.</p>
      </main>
    </Grid>
  );
}
