import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, Math.random() < 0.5 ? "Cara" : "Cruz");
}
