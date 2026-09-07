/**
 * Tirada de dados en notación estándar: `2d6`, `d20`, `4d8+3`, `d100-5`.
 *
 * El README ya prometía "formato tipo D&D (d20, 2d6)" pero el endpoint solo
 * devolvía un número del 1 al 6 con `Math.random() * 6`. Ahora lo cumple.
 *
 * Se exporta aparte y sin tocar la base de datos ni la red, para poder
 * probarlo: es aritmética con límites, justo lo que se rompe en silencio.
 */

/** Topes para que nadie tumbe el servidor con `!dado 99999d99999`. */
export const MAX_DADOS = 50;
export const MAX_CARAS = 1000;

const PATRON = /^\s*(\d*)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i;

/**
 * Interpreta la notación. Devuelve `null` si no encaja, para que quien llama
 * decida el mensaje de error.
 */
export function parsearTirada(entrada) {
  const texto = String(entrada ?? "").trim();
  if (!texto) return { cantidad: 1, caras: 6, modificador: 0 };

  const m = PATRON.exec(texto);
  if (!m) return null;

  const cantidad = m[1] === "" ? 1 : Number(m[1]);
  const caras = Number(m[2]);
  const signo = m[3] === "-" ? -1 : 1;
  const modificador = m[4] ? signo * Number(m[4]) : 0;

  if (cantidad < 1 || cantidad > MAX_DADOS) return null;
  if (caras < 2 || caras > MAX_CARAS) return null;

  return { cantidad, caras, modificador };
}

/** Tira y devuelve el detalle, con `aleatorio` inyectable para poder probarlo. */
export function tirar({ cantidad, caras, modificador }, aleatorio = Math.random) {
  const tiradas = Array.from(
    { length: cantidad },
    () => Math.floor(aleatorio() * caras) + 1
  );
  const suma = tiradas.reduce((a, b) => a + b, 0);
  return { tiradas, total: suma + modificador, modificador };
}

/** Texto de una línea listo para el chat. */
export function formatearTirada(entrada) {
  const spec = parsearTirada(entrada);
  if (!spec) {
    return `❌ No entiendo "${entrada}". Prueba: !dado, !dado d20, !dado 2d6+3 (máx ${MAX_DADOS} dados de ${MAX_CARAS} caras)`;
  }

  const { tiradas, total, modificador } = tirar(spec);
  const detalle = tiradas.length > 1 ? ` [${tiradas.join(", ")}]` : "";
  const mod =
    modificador === 0 ? "" : ` ${modificador > 0 ? "+" : "−"}${Math.abs(modificador)}`;
  const critico =
    spec.cantidad === 1 && spec.caras === 20 && tiradas[0] === 20
      ? " 💥 ¡CRÍTICO!"
      : spec.cantidad === 1 && spec.caras === 20 && tiradas[0] === 1
        ? " 💀 pifia"
        : "";

  return `🎲 ${spec.cantidad}d${spec.caras}${mod} → ${total}${detalle}${critico}`;
}
