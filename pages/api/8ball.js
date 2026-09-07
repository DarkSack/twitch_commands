import { respuesta } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, respuesta[Math.floor(Math.random() * respuesta.length)]);
}
