import { superHeroes } from "@/utils/const";

export default function handler(req, res) {
  const superHero = superHeroes[Math.floor(Math.random() * superHeroes.length)];
  res.status(200).send(superHero);
}
