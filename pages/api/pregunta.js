import { pregunta } from "@/utils/diversion";
import { texto } from "@/utils/respond";

export default function handler(req, res) {
  return texto(res, pregunta());
}
