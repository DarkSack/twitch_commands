import { abrazo } from "@/utils/diversion";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

/** `!abrazo @alguien` — el bot pone `usuario`, el chat pone el destino en `q`. */
export default function handler(req, res) {
  const origen = usuarioValido(parametro(req, "usuario"));
  if (!origen) return fallo(res, 400, "❌ Falta el usuario. Usa ?usuario=tu_nombre");

  const bruto = parametro(req, "destino") ?? (parametro(req, "q") ?? "").split(/\s+/)[0];
  const destino = usuarioValido(bruto);
  return texto(res, abrazo(origen, destino));
}
