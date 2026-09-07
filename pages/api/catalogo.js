import { verCatalogo } from "@/utils/economia";
import { parametro, texto } from "@/utils/respond";

export default function handler(req, res) {
  const categoria = parametro(req, "categoria") ?? parametro(req, "q");
  return texto(res, verCatalogo(categoria));
}
