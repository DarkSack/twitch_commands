import { animales } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, animales[Math.floor(Math.random() * animales.length)]);
}
