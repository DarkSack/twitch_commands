import { insultos } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, insultos[Math.floor(Math.random() * insultos.length)]);
}
