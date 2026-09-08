import { ppt } from "@/utils/diversion";
import { parametro, texto } from "@/utils/respond";

/** El bot manda el resto del mensaje en `q`; `jugada` es para quien pueda mandarlo suelto. */
export default function handler(req, res) {
  const entrada = parametro(req, "jugada") ?? parametro(req, "q") ?? "";
  return texto(res, ppt(entrada));
}
