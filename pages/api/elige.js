import { elige } from "@/utils/diversion";
import { parametro, texto } from "@/utils/respond";

/** El bot manda el resto del mensaje en `q`; `opciones` es para quien pueda mandarlo suelto. */
export default function handler(req, res) {
  const entrada = parametro(req, "opciones") ?? parametro(req, "q") ?? "";
  return texto(res, elige(entrada));
}
