import { realizarDuelo } from "@/utils/functions";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

/**
 * `!duelo @usuario [monedas]`
 *
 * El retador lo pone el bot con $(user); el retado y la apuesta llegan juntos
 * en `q` cuando el bot solo tiene una variable para el resto del mensaje.
 */
export default async function handler(req, res) {
  try {
    const q = (parametro(req, "q") ?? "").split(/\s+/).filter(Boolean);

    const retador = usuarioValido(parametro(req, "retador"));
    const retado = usuarioValido(parametro(req, "retado") ?? q[0]);
    const monedas = parametro(req, "monedas") ?? q[1];

    // La validacion vive aqui y no dentro de `realizarDuelo` para que el
    // endpoint responda 400 ante una peticion mal formada, en vez de 200 con
    // un texto de error: asi el fallo se distingue en los registros.
    if (!retador || !retado) {
      return fallo(res, 400, "❌ Uso: !duelo @usuario (faltan retador o retado)");
    }
    if (retador === retado) {
      return texto(res, "❌ No puedes retarte a ti mismo.");
    }

    return texto(res, await realizarDuelo(retador, retado, monedas));
  } catch (error) {
    console.error("[duelo]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
