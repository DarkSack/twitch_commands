import { cumplidos } from "@/utils/const";

export default function handler(req, res) {
  const cumplido = cumplidos[Math.floor(Math.random() * cumplidos.length)];
  res.status(200).send(cumplido);
}
