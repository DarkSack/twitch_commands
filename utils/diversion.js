/**
 * Comandos sin estado.
 *
 * Nada de aquí toca la base de datos: son funciones puras que reciben texto y
 * devuelven texto. Por eso son los únicos que se anuncian en la portada
 * pública (ver `commands/index.js`): que alguien abuse de `!uwu` no cuesta
 * nada, que abuse de `!trabajar` ensucia la economía del canal.
 *
 * Las que miden algo de una persona (`!amor`, `!iq`, `!suerte`…) usan el hash
 * estable de `aleatorio.js`, NO `Math.random()`. Con azar puro el chat repite
 * el comando hasta que sale el número que le gusta y la broma se muere; con
 * hash, el resultado es el que es.
 */

import {
  barra,
  elegir,
  elegirEstable,
  entero,
  hoy,
  porcentaje,
  tramo,
} from "./aleatorio";
import {
  ABRAZOS,
  BOTINES,
  CLASES_RPG,
  EXCUSAS,
  HABITANTES,
  HOROSCOPOS,
  JUEGOS_TITULO,
  MORSE,
  NOMBRES_FIN,
  NOMBRES_INICIO,
  PALOS,
  PREGUNTAS_CHAT,
  RETOS_STREAM,
  SALAS_MAZMORRA,
  SIGNOS,
  TAROT,
  TITULOS_RPG,
  TITULOS_STREAM,
  TRASFONDOS,
  VALORES,
  ZAPES,
} from "./listas";

/** Tope de texto que se acepta de entrada. Twitch corta en 500 de todos modos. */
const MAX_ENTRADA = 400;

/** Recorta y limpia lo que llega del chat. */
function limpiar(texto) {
  return String(texto ?? "").trim().slice(0, MAX_ENTRADA);
}

/**
 * Parte el texto en letras "visibles".
 *
 * `[...texto].reverse()` parece suficiente y no lo es: parte los emoji
 * compuestos (👨‍👩‍👧 son 5 puntos de código unidos por ZWJ) y los deja como
 * basura. `Intl.Segmenter` agrupa por grafema, que es lo que ve el ojo.
 */
function letras(texto) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const seg = new Intl.Segmenter("es", { granularity: "grapheme" });
    return [...seg.segment(texto)].map((s) => s.segment);
  }
  return [...texto];
}

/* ── Azar y decisiones ────────────────────────────────────────── */

/**
 * `!elige a, b, c` o `!elige a o b`.
 *
 * Se admiten las dos separaciones porque en el chat se escriben las dos. El
 * " o " se busca con espacios alrededor para no partir "chocolate o vainilla"
 * por la "o" de "chocolate".
 */
export function elige(texto) {
  const bruto = limpiar(texto);
  if (!bruto) return "🤔 Dame opciones: !elige pizza, sushi, tacos";

  const opciones = (bruto.includes(",") ? bruto.split(",") : bruto.split(/\s+o\s+/i))
    .map((o) => o.trim())
    .filter(Boolean);

  if (opciones.length < 2) {
    return `🤔 Sólo me has dado una opción, así que… ${opciones[0] ?? bruto}`;
  }
  return `🎯 Yo elijo: ${elegir(opciones)} (de ${opciones.length} opciones)`;
}

/** `!numero`, `!numero 100`, `!numero 5-30`. */
export function numero(texto) {
  const bruto = limpiar(texto);
  const rango = bruto.match(/(-?\d+)\s*(?:-|a|hasta)\s*(-?\d+)/i);
  const solo = bruto.match(/^-?\d+$/);

  let min = 1;
  let max = 100;
  if (rango) {
    min = Number(rango[1]);
    max = Number(rango[2]);
  } else if (solo) {
    const tope = Number(solo[0]);
    // `!numero -20` debe dar algo entre -20 y 0, no un rango invertido raro.
    if (tope < 1) {
      min = tope;
      max = 0;
    } else {
      max = tope;
    }
  } else if (bruto) {
    return "🔢 Uso: !numero, !numero 100 o !numero 5-30";
  }

  const TOPE = 1_000_000_000;
  if (Math.abs(min) > TOPE || Math.abs(max) > TOPE) {
    return "🔢 Rango demasiado grande. Máximo mil millones.";
  }
  return `🔢 ${entero(min, max)} (entre ${Math.min(min, max)} y ${Math.max(min, max)})`;
}

/** `!carta` — una carta de la baraja francesa. */
export function carta() {
  return `🃏 ${elegir(VALORES)} de ${elegir(PALOS)}`;
}

/** `!ppt piedra` — piedra, papel o tijera contra el bot. */
export function ppt(texto) {
  const OPCIONES = ["piedra", "papel", "tijera"];
  const GANA = { piedra: "tijera", papel: "piedra", tijera: "papel" };
  const EMOJI = { piedra: "🪨", papel: "📄", tijera: "✂️" };

  const bruto = limpiar(texto).toLowerCase().replace(/s$/, "");
  const tuya = OPCIONES.find((o) => bruto.startsWith(o.slice(0, 4)));
  if (!tuya) return "🪨 Elige: !ppt piedra, !ppt papel o !ppt tijera";

  const mia = elegir(OPCIONES);
  const linea = `${EMOJI[tuya]} ${tuya} vs ${EMOJI[mia]} ${mia}`;
  if (tuya === mia) return `🤝 ${linea} — empate.`;
  return GANA[tuya] === mia ? `🎉 ${linea} — ganas tú.` : `😈 ${linea} — gano yo.`;
}

/* ── Medidores ────────────────────────────────────────────────── */

/** Dos nombres normalizados y ORDENADOS, para que a+b y b+a den lo mismo. */
function pareja(a, b) {
  return [String(a ?? "").toLowerCase().trim(), String(b ?? "").toLowerCase().trim()]
    .sort()
    .join("+");
}

const ESCALA_AMOR = [
  "ni de broma",
  "de amigos y con esfuerzo",
  "hay algo, pero poco",
  "esto pinta bien",
  "casaos ya",
];

/** `!amor sack fulano` — compatibilidad estable, no cambia al repetir. */
export function amor(a, b) {
  if (!a || !b) return "💘 Uso: !amor <nombre> <nombre>";
  const pct = porcentaje(pareja(a, b), "amor");
  return `💘 ${a} + ${b} = ${pct}% ${barra(pct)} — ${tramo(pct, ESCALA_AMOR)}`;
}

/** `!ship sack fulano` — igual que amor, pero además fusiona los nombres. */
export function ship(a, b) {
  if (!a || !b) return "🚢 Uso: !ship <nombre> <nombre>";
  const [x, y] = [String(a), String(b)];
  const corte = Math.max(1, Math.ceil(x.length / 2));
  const nombre = x.slice(0, corte) + y.slice(Math.floor(y.length / 2));
  const pct = porcentaje(pareja(a, b), "ship");
  return `🚢 ${x} + ${y} = «${nombre}» · ${pct}% ${barra(pct)}`;
}

const ESCALA_SUERTE = [
  "no salgas de casa",
  "día flojo",
  "normalito",
  "vas con viento a favor",
  "juega a la lotería",
];

/** `!suerte` — estable dentro del día, distinta mañana. */
export function suerte(usuario) {
  if (!usuario) return "🍀 Uso: !suerte (lo rellena tu bot con $(user))";
  const pct = porcentaje(usuario, `suerte|${hoy()}`);
  return `🍀 Suerte de ${usuario} hoy: ${pct}% ${barra(pct)} — ${tramo(pct, ESCALA_SUERTE)}`;
}

/** `!iq` — de 0 a 200, fijo por persona. Que no cambie es medio chiste. */
export function iq(usuario) {
  if (!usuario) return "🧠 Uso: !iq (lo rellena tu bot con $(user))";
  const valor = Math.round((porcentaje(usuario, "iq") / 100) * 200);
  const nota =
    valor < 40 ? "…¿todo bien?" :
    valor < 90 ? "dentro de lo esperable" :
    valor < 130 ? "por encima de la media" :
    valor < 180 ? "sospechosamente alto" : "esto ya es trampa";
  return `🧠 IQ de ${usuario}: ${valor} — ${nota}`;
}

const ESCALA_SIMP = ["inmune", "lo justo", "vas cayendo", "muy tocado", "caso perdido"];

/** `!simp` — cambia cada día. */
export function simp(usuario) {
  if (!usuario) return "😍 Uso: !simp (lo rellena tu bot con $(user))";
  const pct = porcentaje(usuario, `simp|${hoy()}`);
  return `😍 Nivel de simp de ${usuario}: ${pct}% ${barra(pct)} — ${tramo(pct, ESCALA_SIMP)}`;
}

const ESCALA_CORDURA = ["ya nada", "colgando de un hilo", "regular", "aceptable", "intacta"];

/** `!cordura` — cambia cada día. */
export function cordura(usuario) {
  if (!usuario) return "🫠 Uso: !cordura (lo rellena tu bot con $(user))";
  const pct = porcentaje(usuario, `cordura|${hoy()}`);
  return `🫠 Cordura de ${usuario}: ${pct}% ${barra(pct)} — ${tramo(pct, ESCALA_CORDURA)}`;
}

/* ── Juegos de texto ──────────────────────────────────────────── */

/** `!uwu hola que tal`. */
export function uwu(texto) {
  const bruto = limpiar(texto);
  if (!bruto) return "🥺 Escribe algo: !uwu hola que tal";
  const CARITAS = [" uwu", " owo", " >w<", " ^-^", " :3"];
  const convertido = bruto
    .replace(/[rl]/g, "w")
    .replace(/[RL]/g, "W")
    .replace(/n([aeiou])/g, "ny$1")
    .replace(/N([aeiou])/g, "Ny$1");
  return convertido + elegir(CARITAS);
}

/** `!alreves hola` — respeta emoji compuestos, ver `letras()`. */
export function alreves(texto) {
  const bruto = limpiar(texto);
  if (!bruto) return "🔄 Escribe algo: !alreves hola mundo";
  return `🔄 ${letras(bruto).reverse().join("")}`;
}

/** `!aesthetic hola` — ancho completo, el clásico vaporwave. */
export function aesthetic(texto) {
  const bruto = limpiar(texto).slice(0, 100);
  if (!bruto) return "🌴 Escribe algo: !aesthetic vaporwave";
  return [...bruto]
    .map((c) => {
      const cp = c.codePointAt(0);
      if (cp === 32) return "　";
      // Sólo el ASCII imprimible tiene equivalente de ancho completo; el resto
      // (acentos, emoji) se deja tal cual en vez de convertirlo en basura.
      return cp > 32 && cp < 127 ? String.fromCodePoint(cp + 0xfee0) : c;
    })
    .join("");
}

/** `!morse sos`. Lo que no está en la tabla se marca con "?". */
export function morse(texto) {
  const bruto = limpiar(texto).slice(0, 60);
  if (!bruto) return "📡 Escribe algo: !morse sos";
  const codigo = bruto
    .toLowerCase()
    .split(/\s+/)
    .map((palabra) => [...palabra].map((c) => MORSE[c] ?? "?").join(" "))
    .join(" / ");
  return `📡 ${codigo}`;
}

/** `!contar <texto>` — palabras, caracteres y cuánto cabe en un tuit. */
export function contar(texto) {
  const bruto = limpiar(texto);
  if (!bruto) return "🔢 Escribe algo: !contar este texto de aquí";
  const palabras = bruto.split(/\s+/).filter(Boolean).length;
  const caracteres = letras(bruto).length;
  return `🔢 ${palabras} palabra${palabras === 1 ? "" : "s"}, ${caracteres} caracteres (sin espacios: ${bruto.replace(/\s/g, "").length})`;
}

/* ── Rol y fantasía ───────────────────────────────────────────── */

/** `!nombrerpg` — mismo chatter, mismo nombre siempre. */
export function nombreRpg(usuario) {
  const semilla = usuario || String(Math.random());
  const nombre =
    elegirEstable(NOMBRES_INICIO, semilla, "ini") +
    elegirEstable(NOMBRES_FIN, semilla, "fin");
  return `⚔️ ${nombre} ${elegirEstable(TITULOS_RPG, semilla, "tit")}`;
}

/** `!clase` — clase y trasfondo, al azar de verdad: es para tirar ideas. */
export function claseRpg() {
  const [clase, chiste] = elegir(CLASES_RPG);
  return `🎲 ${clase} — ${chiste}. Trasfondo: ${elegir(TRASFONDOS)}.`;
}

/** `!mazmorra` — una sala completa para improvisar. */
export function mazmorra() {
  return `🏰 Entras en ${elegir(SALAS_MAZMORRA)}. Dentro hay ${elegir(HABITANTES)}. Si sobrevives: ${elegir(BOTINES)}.`;
}

/**
 * `!loot` — botín narrativo.
 *
 * NO toca el inventario: es texto y se queda en texto. El inventario de verdad
 * es `!mercado`, que sí escribe en la base de datos.
 */
export function loot() {
  return `💎 Encuentras ${elegir(BOTINES)}.`;
}

/** `!tarot` — una carta por persona y día. */
export function tarot(usuario) {
  const semilla = usuario || "chat";
  const [nombre, significado] = elegirEstable(TAROT, semilla, `tarot|${hoy()}`);
  return `🔮 ${usuario ? `${usuario}, tu` : "Tu"} carta de hoy: ${nombre} — ${significado}`;
}

/* ── Para el directo ──────────────────────────────────────────── */

export function reto() {
  return `🔥 Reto: ${elegir(RETOS_STREAM)}.`;
}

export function excusa() {
  return `🙄 Excusa oficial: ${elegir(EXCUSAS)}.`;
}

/** `!titulo` o `!titulo Minecraft` — título clickbait para el stream. */
export function titulo(juego) {
  const nombre = limpiar(juego).slice(0, 40) || elegir(JUEGOS_TITULO);
  const [antes, despues] = elegir(TITULOS_STREAM);
  return `📺 «${antes} ${nombre} ${despues}»`;
}

export function pregunta() {
  return `💬 ${elegir(PREGUNTAS_CHAT)}`;
}

/* ── Interacción ──────────────────────────────────────────────── */

/** Acción de un chatter sobre otro. Comparte forma con `zape`. */
function accion(origen, destino, frases, emoji, soloUno) {
  if (!origen) return `${emoji} Falta quién lo hace.`;
  if (!destino) return `${emoji} ¿A quién? Uso: !${soloUno} <alguien>`;
  if (origen.toLowerCase() === destino.toLowerCase()) {
    return `${emoji} ${origen} se lo hace a sí mismo. Nos preocupa.`;
  }
  return `${emoji} ${origen} ${elegir(frases)} ${destino}`;
}

export function abrazo(origen, destino) {
  return accion(origen, destino, ABRAZOS, "🤗", "abrazo");
}

export function zape(origen, destino) {
  return accion(origen, destino, ZAPES, "👋", "zape");
}

/* ── Utilidades ───────────────────────────────────────────────── */

/** `!horoscopo leo` — misma predicción todo el día para todo el signo. */
export function horoscopo(texto) {
  const bruto = limpiar(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const signo = SIGNOS.find((s) => bruto.startsWith(s.slice(0, 4)));
  if (!signo) return `♈ Dime tu signo: ${SIGNOS.join(", ")}`;
  return `♈ ${signo}: ${elegirEstable(HOROSCOPOS, signo, `horo|${hoy()}`)}`;
}

/**
 * `!cuentaatras 2026-12-25` o `!cuentaatras 25/12/2026`.
 *
 * Se compara a mediodía UTC de cada fecha, no a medianoche: así el cambio de
 * huso horario no convierte "faltan 3 días" en 2 según desde dónde se mire.
 */
export function cuentaAtras(texto) {
  const bruto = limpiar(texto);
  if (!bruto) return "📅 Uso: !cuentaatras 2026-12-25 (o 25/12/2026)";

  const iso = bruto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const euro = bruto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  let a, m, d;
  if (iso) [, a, m, d] = iso;
  else if (euro) [, d, m, a] = euro;
  else return "📅 Formato no válido. Usa 2026-12-25 o 25/12/2026";

  const destino = Date.UTC(Number(a), Number(m) - 1, Number(d), 12);
  // `Date.UTC` no valida: el 31 de febrero se convierte en marzo sin avisar.
  const comprobar = new Date(destino);
  if (comprobar.getUTCMonth() !== Number(m) - 1 || comprobar.getUTCDate() !== Number(d)) {
    return "📅 Esa fecha no existe.";
  }

  const ahora = new Date();
  const base = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 12);
  const dias = Math.round((destino - base) / 86_400_000);

  if (dias === 0) return `📅 ¡Es hoy! (${bruto})`;
  if (dias > 0) return `📅 Faltan ${dias} día${dias === 1 ? "" : "s"} para ${bruto}`;
  const pasados = Math.abs(dias);
  return `📅 Hace ${pasados} día${pasados === 1 ? "" : "s"} de ${bruto}`;
}
