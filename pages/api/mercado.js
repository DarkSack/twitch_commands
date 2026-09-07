import { gestionarMercado } from "@/utils/mercado";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

export default async function handler(req, res) {
  try {
    const usuario = usuarioValido(parametro(req, "usuario"));
    if (!usuario) return fallo(res, 400, "❌ Falta el usuario. Usa ?usuario=tu_nombre");

    // Los bots mandan el resto del mensaje en un solo parametro, asi que
    // "comprar Daga Oxidada" llega junto y hay que partirlo.
    const q = parametro(req, "q");
    const accion = parametro(req, "accion") ?? q?.split(/\s+/)[0];
    const item = parametro(req, "item") ?? q?.split(/\s+/).slice(1).join(" ");

    return texto(res, await gestionarMercado(usuario, accion, item || null));
  } catch (error) {
    console.error("[mercado]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
