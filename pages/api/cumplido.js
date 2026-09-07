import { cumplidos } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, cumplidos[Math.floor(Math.random() * cumplidos.length)]);
}
