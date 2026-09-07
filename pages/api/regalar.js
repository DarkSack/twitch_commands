import { regalar } from "@/utils/economia";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

/**
 * `!regalar @usuario 100`
 *
 * Nightbot manda todo el resto del mensaje en una sola variable, asi que
 * `q` llega como "@usuario 100" y hay que partirlo aqui. Se admiten tambien
 * `destino` y `cantidad` sueltos, para bots que si sepan separarlos.
 */
export default async function handler(req, res) {
  try {
    const origen = usuarioValido(parametro(req, "usuario"));
    if (!origen) return fallo(res, 400, "❌ Falta el usuario. Usa ?usuario=tu_nombre");

    const q = (parametro(req, "q") ?? "").split(/\s+/).filter(Boolean);
    const destino = usuarioValido(parametro(req, "destino") ?? q[0]);
    const cantidad = parametro(req, "cantidad") ?? q[1];

    if (!destino) return fallo(res, 400, "❌ Uso: !regalar @usuario <cantidad>");
    return texto(res, await regalar(origen, destino, cantidad));
  } catch (error) {
    console.error("[regalar]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
