import { comandosPublicos, porGrupo } from "@/commands";
import { parametro, texto } from "@/utils/respond";

/**
 * `!comandos` — la lista, desde el mismo catálogo que documenta el README.
 *
 * Sólo lista los PÚBLICOS. Los que escriben en la base de datos existen y
 * siguen respondiendo, pero no se anuncian: si `!comandos` los recitara en el
 * chat, esconderlos de la portada no serviría de nada.
 *
 * Con 40 comandos públicos la lista entera no cabe en un mensaje de Twitch
 * (480 caracteres), así que sin argumento se devuelven los grupos, y
 * `!comandos medidor` da los de ese grupo.
 */
export default function handler(req, res) {
  const pedido = (parametro(req, "grupo") ?? parametro(req, "q") ?? "")
    .toLowerCase()
    .trim();

  const grupos = porGrupo();

  if (!pedido) {
    const resumen = grupos
      .map((g) => `${g.emoji} ${g.id} (${g.comandos.length})`)
      .join(" · ");
    return texto(res, `📜 ${comandosPublicos.length} comandos en ${grupos.length} grupos: ${resumen}. Pide uno: !comandos medidor`);
  }

  const grupo = grupos.find(
    (g) => g.id === pedido || g.etiqueta.toLowerCase().startsWith(pedido)
  );
  if (!grupo) {
    return texto(res, `❌ No existe el grupo "${pedido}". Hay: ${grupos.map((g) => g.id).join(", ")}`);
  }

  return texto(res, `${grupo.emoji} ${grupo.etiqueta}: ${grupo.comandos.map((c) => `!${c.name}`).join(" ")}`);
}
