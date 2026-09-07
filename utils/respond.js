/**
 * Respuestas para bots de chat.
 *
 * Todos estos endpoints los consume un bot (Nightbot, StreamElements, Botrix)
 * que pega el cuerpo tal cual en el chat de Twitch. Eso impone dos cosas que
 * antes no se cumplian:
 *
 * 1. `Content-Type: text/plain; charset=utf-8`. Sin cabecera, Next no manda
 *    ninguna y el cliente adivina la codificacion: los acentos y los emoji
 *    salian como "dÃ­a" en el chat. Comprobado con curl sobre /api/insulto,
 *    que respondia sin Content-Type.
 *
 * 2. Una sola linea. Un `\n` en la respuesta corta el mensaje en Twitch, asi
 *    que los saltos se convierten en separadores visibles.
 *
 * `texto()` responde 200 aunque el mensaje sea un error de juego ("no tienes
 * monedas"): para el bot es una respuesta valida que mostrar. `fallo()` es
 * para errores de verdad, los que el bot no deberia recitar.
 */

/** Limite de un mensaje de chat de Twitch. */
const MAX_TWITCH = 480;

export function texto(res, mensaje) {
  const plano = String(mensaje ?? "")
    .replace(/\s*\n+\s*/g, " · ")
    .trim();

  const recortado =
    plano.length > MAX_TWITCH ? `${plano.slice(0, MAX_TWITCH - 1)}…` : plano;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  // Un bot pide la misma URL cada vez que alguien escribe el comando: si se
  // cachea, todo el chat ve el mismo numero aleatorio.
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).send(recortado);
}

export function fallo(res, codigo, mensaje) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(codigo).send(String(mensaje));
}

/**
 * Lee un parametro de la query y lo normaliza.
 *
 * Next entrega un array cuando el parametro viene repetido (`?usuario=a&usuario=b`),
 * y varias funciones lo metian tal cual en una consulta SQL esperando texto.
 */
export function parametro(req, nombre) {
  const bruto = req.query?.[nombre];
  const valor = Array.isArray(bruto) ? bruto[0] : bruto;
  const limpio = typeof valor === "string" ? valor.trim() : "";
  return limpio.length > 0 ? limpio : null;
}

/**
 * Nombre de usuario de Twitch: 4-25 caracteres, letras, digitos y guion bajo.
 * Se acepta el `@` de delante porque el bot lo pasa tal cual cuando alguien
 * escribe `!duelo @fulano`.
 */
export function usuarioValido(valor) {
  if (!valor) return null;
  const sinArroba = valor.replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9_]{1,25}$/.test(sinArroba) ? sinArroba : null;
}
