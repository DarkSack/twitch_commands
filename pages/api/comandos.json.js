import { BASE_URL, GRUPOS, comandosPublicos, ejemploNightbot, porGrupo } from "@/commands";

/**
 * El catálogo en JSON, para que lo consuma la portada.
 *
 * `/api/comandos` devuelve texto de una línea porque lo pega un bot en el chat
 * de Twitch. Esto es otra cosa: la web necesita la estructura entera, y por eso
 * es un endpoint aparte en lugar de un parámetro del otro.
 *
 * El snippet de Nightbot se calcula AQUÍ y viaja ya montado. Es lo que permite
 * que la portada viva en otro repositorio sin copiarse `commands/index.js`:
 * si el catálogo se quedara en los dos sitios, en dos semanas anunciarían
 * cosas distintas.
 *
 * Sólo salen los públicos, igual que en la portada y en `/api/comandos`. Los de
 * economía existen y responden, pero no se anuncian.
 */
export default function handler(req, res) {
  const grupos = porGrupo().map((g) => ({
    id: g.id,
    etiqueta: g.etiqueta,
    emoji: g.emoji,
    comandos: g.comandos.map((c) => ({
      name: c.name,
      grupo: c.grupo,
      params: c.params,
      description: c.description,
      nightbot: ejemploNightbot(c),
    })),
  }));

  // Cualquiera puede leerlo: ya es público en la portada. Sin esto, un fetch
  // desde el navegador de otro dominio se queda bloqueado por CORS.
  res.setHeader("Access-Control-Allow-Origin", "*");

  // La portada lo lee al compilar, así que el que manda es el revalidate de
  // Next. Esta cabecera es para el resto: un minuto en el borde y hasta un día
  // sirviendo el anterior mientras se refresca, para que un despliegue a medias
  // no deje la lista en blanco.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=86400"
  );

  res.status(200).json({
    generado: new Date().toISOString(),
    base: BASE_URL,
    total: comandosPublicos.length,
    totalGrupos: grupos.length,
    gruposDeclarados: GRUPOS.length,
    grupos,
  });
}
