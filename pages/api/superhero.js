import { superHeroes } from "@/utils/const";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, superHeroes[Math.floor(Math.random() * superHeroes.length)]);
}
