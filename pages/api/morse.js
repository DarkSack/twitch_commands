import { morse } from "@/utils/diversion";
import { parametro, texto } from "@/utils/respond";

/** El bot manda el resto del mensaje en `q`; `texto` es para quien pueda mandarlo suelto. */
export default function handler(req, res) {
  const entrada = parametro(req, "texto") ?? parametro(req, "q") ?? "";
  return texto(res, morse(entrada));
}
