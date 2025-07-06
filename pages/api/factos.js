import { factos } from "@/utils/const";

export default function handler(req, res) {
  const fact = factos[Math.floor(Math.random() * factos.length)];
  res.status(200).send(fact);
}
