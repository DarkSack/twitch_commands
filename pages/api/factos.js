import { factos } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, factos[Math.floor(Math.random() * factos.length)]);
}
