import { horoscopo } from "@/utils/diversion";
import { parametro, texto } from "@/utils/respond";

/** El bot manda el resto del mensaje en `q`; `signo` es para quien pueda mandarlo suelto. */
export default function handler(req, res) {
  const entrada = parametro(req, "signo") ?? parametro(req, "q") ?? "";
  return texto(res, horoscopo(entrada));
}
