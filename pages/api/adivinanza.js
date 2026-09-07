import { adivinanzas } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  const random = adivinanzas[Math.floor(Math.random() * adivinanzas.length)];
  // Antes devolvia JSON, que el bot pegaba crudo en el chat con llaves y
  // comillas. La respuesta no se incluye: es una adivinanza, se resuelve
  // con `!adivinanza pista` o la dice el streamer.
  return texto(res, `🤔 ${random.pregunta} (pista: ${random.pista})`);
}
