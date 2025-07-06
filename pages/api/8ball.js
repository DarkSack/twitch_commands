import { respuesta } from "@/utils/const";

export default function handler(req, res) {
  res.status(200).send(respuesta[Math.floor(Math.random() * respuesta.length)]);
}
