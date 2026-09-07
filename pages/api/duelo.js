import { realizarDuelo } from "@/utils/functions";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

export default async function handler(req, res) {
  try {
    const retador = usuarioValido(parametro(req, "retador"));
    const retado = usuarioValido(parametro(req, "retado"));

    // La validacion vive aqui y no dentro de `realizarDuelo` para que el
    // endpoint responda 400 ante una peticion mal formada, en vez de 200 con
    // un texto de error: asi el fallo se distingue en los registros.
    if (!retador || !retado) {
      return fallo(res, 400, "❌ Uso: !duelo @usuario (faltan retador o retado)");
    }

    const monedas = parametro(req, "monedas");
    return texto(res, await realizarDuelo(retador, retado, monedas));
  } catch (error) {
    console.error("[duelo]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
