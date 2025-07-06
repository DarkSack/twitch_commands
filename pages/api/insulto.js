import { insultos } from "@/utils/const";

export default function handler(req, res) {
  const insulto = insultos[Math.floor(Math.random() * insultos.length)];
  res.status(200).send(insulto);
}
