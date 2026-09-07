import { robar } from "@/utils/economia";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

export default async function handler(req, res) {
  try {
    const ladron = usuarioValido(parametro(req, "usuario"));
    const victima = usuarioValido(parametro(req, "victima") ?? parametro(req, "q"));
    if (!ladron || !victima) {
      return fallo(res, 400, "❌ Uso: !robar @usuario");
    }
    return texto(res, await robar(ladron, victima));
  } catch (error) {
    console.error("[robar]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
