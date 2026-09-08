import { suerte } from "@/utils/diversion";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

export default function handler(req, res) {
  const usuario = usuarioValido(parametro(req, "usuario"));
  if (!usuario) return fallo(res, 400, "❌ Falta el usuario. Usa ?usuario=tu_nombre");
  return texto(res, suerte(usuario));
}
