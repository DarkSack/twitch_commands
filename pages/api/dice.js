import { texto } from "@/utils/respond";

export default function handler(req, res) {
  // Se envia como texto, no como numero: `res.send(6)` hacia que Next
  // respondiera `application/json`, distinto del resto de comandos.
  return texto(res, String(Math.floor(Math.random() * 6) + 1));
}
