import { loot } from "@/utils/diversion";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, loot());
}
