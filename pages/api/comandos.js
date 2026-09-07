import { comandos } from "@/commands";
import { texto } from "@/utils/respond";

/**
 * `!comandos` — la lista, desde el mismo catalogo que documenta el README.
 *
 * El README anterior prometia un `/api/commands` que no existia en ningun
 * sitio. Ahora existe, y lee de `commands/index.js` para que la lista no se
 * pueda desincronizar de la documentacion.
 */
export default function handler(req, res) {
  return texto(res, `📜 Comandos: ${comandos.map((c) => `!${c.name}`).join(" ")}`);
}
