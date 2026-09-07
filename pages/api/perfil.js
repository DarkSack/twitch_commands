import { verPerfil } from "@/utils/economia";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

export default async function handler(req, res) {
  try {
    const usuario = usuarioValido(parametro(req, "usuario"));
    if (!usuario) return fallo(res, 400, "❌ Falta el usuario. Usa ?usuario=tu_nombre");
    return texto(res, await verPerfil(usuario));
  } catch (error) {
    console.error("[perfil]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
