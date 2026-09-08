/**
 * Azar para comandos de chat.
 *
 * Hay dos clases de azar aqui y mezclarlas es el fallo tipico de estos bots:
 *
 * - AZAR PURO (`elegir`, `entero`): cada peticion da algo distinto. Es lo que
 *   quieres en `!dado` o `!flip`.
 *
 * - AZAR ESTABLE (`hash`, `porcentaje`): la misma entrada da SIEMPRE el mismo
 *   resultado. Es lo que quieres en `!amor sack fulano`. Con `Math.random()`,
 *   el chat repite el comando hasta que sale el 100 % y el numero deja de
 *   significar nada; con hash, el 37 % es el 37 % y no hay nada que reintentar.
 *
 * `porcentaje` acepta una "sal" para los casos que deben cambiar por dia
 * (`!suerte`) sin dejar de ser estables dentro del mismo dia.
 */

/** FNV-1a de 32 bits: corto, sin dependencias y bien repartido. */
export function hash(texto) {
  let h = 0x811c9dc5;
  const s = String(texto).toLowerCase();
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    // Multiplicacion por 16777619 hecha con sumas de desplazamientos para no
    // salirse de los 32 bits que garantiza el operador `|`.
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h >>> 0;
}

/** Fecha de hoy en ISO corto. Sal para lo que debe cambiar cada dia. */
export function hoy() {
  return new Date().toISOString().slice(0, 10);
}

/** 0-100 estable para una entrada. `sal` la hace variar por dia, canal, etc. */
export function porcentaje(entrada, sal = "") {
  return hash(`${entrada}|${sal}`) % 101;
}

/**
 * Elemento estable de una lista.
 *
 * Se usa para que `!horoscopo aries` no cambie de prediccion cada vez que
 * alguien lo escribe, pero si cambie manana.
 */
export function elegirEstable(lista, entrada, sal = "") {
  if (!Array.isArray(lista) || lista.length === 0) return null;
  return lista[hash(`${entrada}|${sal}`) % lista.length];
}

/** Elemento al azar de verdad. */
export function elegir(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return null;
  return lista[Math.floor(Math.random() * lista.length)];
}

/** Entero al azar entre `min` y `max`, ambos incluidos. */
export function entero(min, max) {
  const a = Math.ceil(Math.min(min, max));
  const b = Math.floor(Math.max(min, max));
  return a + Math.floor(Math.random() * (b - a + 1));
}

/**
 * Barra visual de 10 casillas.
 *
 * En Twitch no hay imagenes ni formato, asi que un 73 % se lee mucho mejor
 * como barra que como numero suelto.
 */
export function barra(pct, ancho = 10) {
  const llenos = Math.round((Math.max(0, Math.min(100, pct)) / 100) * ancho);
  return "█".repeat(llenos) + "░".repeat(ancho - llenos);
}

/**
 * Etiqueta para un porcentaje segun una escala de 5 tramos.
 * `escala[0]` es 0-20, `escala[4]` es 81-100.
 */
export function tramo(pct, escala) {
  const i = Math.min(4, Math.floor(Math.max(0, Math.min(100, pct)) / 20.01));
  return escala[i];
}
