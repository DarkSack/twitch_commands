import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, `tiene una facha de ${(Math.random() * 100).toFixed(1)}%`);
}
