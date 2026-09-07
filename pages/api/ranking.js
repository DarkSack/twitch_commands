import { verRanking } from "@/utils/economia";
import { fallo, parametro, texto } from "@/utils/respond";

export default async function handler(req, res) {
  try {
    const pedido = Number(parametro(req, "top"));
    // Sin tope, `?top=999999` obligaria a formatear toda la tabla en una
    // respuesta que Twitch no puede mostrar.
    const limite = Number.isFinite(pedido) ? Math.min(Math.max(pedido, 1), 10) : 5;
    return texto(res, await verRanking(limite));
  } catch (error) {
    console.error("[ranking]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
