import { formatearTirada } from "@/utils/dados";
import { parametro, texto } from "@/utils/respond";

/**
 * `!dado` — antes `!dice`.
 *
 * Acepta la tirada por `?tirada=` o por `?q=`, que es como los bots suelen
 * pasar el resto del mensaje del chat.
 */
export default function handler(req, res) {
  const tirada = parametro(req, "tirada") ?? parametro(req, "q") ?? "";
  return texto(res, formatearTirada(tirada));
}
