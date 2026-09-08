import { titulo } from "@/utils/diversion";
import { parametro, texto } from "@/utils/respond";

/** El bot manda el resto del mensaje en `q`; `juego` es para quien pueda mandarlo suelto. */
export default function handler(req, res) {
  const entrada = parametro(req, "juego") ?? parametro(req, "q") ?? "";
  return texto(res, titulo(entrada));
}
