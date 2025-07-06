import { animales } from "@/utils/const";

export default function handler(req, res) {
  const animal = animales[Math.floor(Math.random() * animales.length)];
  res.status(200).send(animal);
}