import { getEmoji } from "@/utils/functions";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  const medida = Number((Math.random() * 29.5 + 0.5).toFixed(1));
  return texto(res, `le mide ${medida}cm ${getEmoji(medida)}`);
}
