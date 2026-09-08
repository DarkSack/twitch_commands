/**
 * Catálogo de comandos. Fuente única: lo sirve `/api/comandos`, lo pinta la
 * portada y lo documenta el README, así que un endpoint sin entrada aquí se
 * nota enseguida.
 *
 * Cada comando declara tres cosas:
 *
 * - `estado`  — si lee o escribe en la base de datos.
 * - `grupo`   — para agrupar en la portada. Con 55 comandos, una lista plana
 *               ya no se lee: hay que poder ir a "medidores" directamente.
 * - `publico` — si aparece en la portada y en `/api/comandos`.
 *
 * `publico` NO es simplemente `!estado`, y por eso es un campo aparte:
 * `!catalogo` no toca la base de datos pero sólo tiene sentido al lado de
 * `!mercado`, que sí, y anunciarlo suelto sería señalar hacia la parte que se
 * quiere discreta.
 *
 * ────────────────────────────────────────────────────────────────
 * AVISO, para que no se confunda con lo que no es:
 *
 * Quitar un comando de la portada NO lo protege. `/api/trabajar` sigue siendo
 * una URL pública que responde a cualquiera que la escriba, y cualquiera que
 * mire el chat del canal ve el comando en cuanto alguien lo usa.
 *
 * Esto reduce el descubrimiento casual —que es lo que causa el 99 % del ruido
 * en una base de datos de un canal pequeño—, no el abuso decidido. Para eso
 * hace falta que los endpoints con estado exijan un secreto compartido que
 * sólo conozca el bot.
 * ────────────────────────────────────────────────────────────────
 */

/** Grupos, en el orden en que se pintan. */
export const GRUPOS = [
  { id: "azar", etiqueta: "Azar y decisiones", emoji: "🎲" },
  { id: "medidor", etiqueta: "Medidores", emoji: "📊" },
  { id: "texto", etiqueta: "Juegos de texto", emoji: "🔤" },
  { id: "rpg", etiqueta: "Rol y fantasía", emoji: "⚔️" },
  { id: "directo", etiqueta: "Para el directo", emoji: "📺" },
  { id: "chat", etiqueta: "Interacción", emoji: "🤝" },
  { id: "util", etiqueta: "Utilidades", emoji: "🧰" },
  { id: "economia", etiqueta: "Economía", emoji: "💰" },
  { id: "juego", etiqueta: "Apuestas y duelos", emoji: "🎰" },
];

const CRUDO = [
  /* ── Azar y decisiones ──────────────────────────────────────── */
  { name: "8ball", grupo: "azar", params: [], description: "Bola 8 mágica: responde a lo que le preguntes." },
  { name: "adivinanza", grupo: "azar", params: [], description: "Una adivinanza con su pista." },
  { name: "carta", grupo: "azar", params: [], description: "Saca una carta de la baraja francesa." },
  { name: "dado", grupo: "azar", params: ["tirada?"], description: "Tira dados: !dado, !dado d20, !dado 2d6+3." },
  { name: "elige", grupo: "azar", params: ["opciones"], description: "Elige por ti: !elige pizza, sushi, tacos." },
  { name: "flip", grupo: "azar", params: [], description: "Cara o cruz." },
  { name: "numero", grupo: "azar", params: ["rango?"], description: "Número al azar: !numero, !numero 100, !numero 5-30." },
  { name: "ppt", grupo: "azar", params: ["jugada"], description: "Piedra, papel o tijera contra el bot." },

  /* ── Medidores ──────────────────────────────────────────────── */
  { name: "amor", grupo: "medidor", params: ["usuario", "otro"], description: "Compatibilidad entre dos nombres. Siempre da lo mismo." },
  { name: "cordura", grupo: "medidor", params: ["usuario"], description: "Cuánta cordura te queda hoy." },
  { name: "facha", grupo: "medidor", params: [], description: "Tu porcentaje de facha." },
  { name: "iq", grupo: "medidor", params: ["usuario"], description: "Tu cociente intelectual, fijo de por vida." },
  { name: "memide", grupo: "medidor", params: [], description: "Una medida con emoji." },
  { name: "ship", grupo: "medidor", params: ["usuario", "otro"], description: "Fusiona dos nombres y les pone nota." },
  { name: "simp", grupo: "medidor", params: ["usuario"], description: "Tu nivel de simp del día." },
  { name: "suerte", grupo: "medidor", params: ["usuario"], description: "Tu suerte de hoy. Mañana es otra." },

  /* ── Juegos de texto ────────────────────────────────────────── */
  { name: "aesthetic", grupo: "texto", params: ["texto"], description: "Ｅｓｐａｃｉａ  ｅｌ  ｔｅｘｔｏ." },
  { name: "alreves", grupo: "texto", params: ["texto"], description: "Le da la vuelta al texto, emoji incluidos." },
  { name: "contar", grupo: "texto", params: ["texto"], description: "Cuenta palabras y caracteres." },
  { name: "morse", grupo: "texto", params: ["texto"], description: "Traduce a código morse." },
  { name: "uwu", grupo: "texto", params: ["texto"], description: "Twaduce ew texto a uwu." },

  /* ── Rol y fantasía ─────────────────────────────────────────── */
  { name: "animal", grupo: "rpg", params: [], description: "Un animal inventado, en texto." },
  { name: "clase", grupo: "rpg", params: [], description: "Una clase de rol con su trasfondo." },
  { name: "loot", grupo: "rpg", params: [], description: "Un botín al azar. Sólo narrativo." },
  { name: "mazmorra", grupo: "rpg", params: [], description: "Genera una sala con habitante y recompensa." },
  { name: "nombrerpg", grupo: "rpg", params: ["usuario"], description: "Tu nombre de personaje, siempre el mismo." },
  { name: "superhero", grupo: "rpg", params: [], description: "Un superhéroe inventado." },
  { name: "tarot", grupo: "rpg", params: ["usuario"], description: "Tu carta del tarot de hoy." },

  /* ── Para el directo ────────────────────────────────────────── */
  { name: "excusa", grupo: "directo", params: [], description: "Una excusa para haber perdido." },
  { name: "pregunta", grupo: "directo", params: [], description: "Una pregunta para animar el chat." },
  { name: "reto", grupo: "directo", params: [], description: "Un reto para la siguiente partida." },
  { name: "titulo", grupo: "directo", params: ["juego?"], description: "Un título clickbait para el stream." },

  /* ── Interacción ────────────────────────────────────────────── */
  { name: "abrazo", grupo: "chat", params: ["usuario", "destino"], description: "Abraza a otro chatter." },
  { name: "cumplido", grupo: "chat", params: [], description: "Un cumplido al azar." },
  { name: "insulto", grupo: "chat", params: [], description: "Un insulto en tono cómico." },
  { name: "zape", grupo: "chat", params: ["usuario", "destino"], description: "Dale un zape a otro chatter." },

  /* ── Utilidades ─────────────────────────────────────────────── */
  { name: "comandos", grupo: "util", params: [], description: "Esta misma lista." },
  { name: "cuentaatras", grupo: "util", params: ["fecha"], description: "Días que faltan: !cuentaatras 2026-12-25." },
  { name: "factos", grupo: "util", params: [], description: "Un dato curioso." },
  { name: "horoscopo", grupo: "util", params: ["signo"], description: "El horóscopo del día por signo." },

  /* ── Economía · privados ────────────────────────────────────── */
  // `catalogo` no toca la base de datos, pero se marca privado a mano: sólo
  // se entiende junto a `!mercado`, y anunciarlo apuntaría hacia él.
  { name: "catalogo", grupo: "economia", publico: false, params: ["categoria?"], description: "Los items que existen, por categoría." },
  { name: "diario", grupo: "economia", estado: true, params: ["usuario"], description: "Recompensa diaria, con bonus por racha." },
  { name: "dormir", grupo: "economia", estado: true, params: ["usuario"], description: "Recupera energía y baja el estrés." },
  { name: "inventario", grupo: "economia", estado: true, params: ["usuario"], description: "Lo que tienes y lo que llevas puesto." },
  { name: "mercado", grupo: "economia", estado: true, params: ["usuario", "accion?", "item?"], description: "ver, comprar, vender, equipar, desequipar." },
  { name: "perfil", grupo: "economia", estado: true, params: ["usuario"], description: "Tus estadísticas y tu equipo." },
  { name: "ranking", grupo: "economia", estado: true, params: ["top?"], description: "Top de monedas del canal." },
  { name: "regalar", grupo: "economia", estado: true, params: ["usuario", "destino", "cantidad"], description: "Regala monedas a otro chatter." },
  { name: "trabajar", grupo: "economia", estado: true, params: ["usuario"], description: "Trabaja por monedas. Una vez por hora." },

  /* ── Apuestas y duelos · privados ───────────────────────────── */
  { name: "apostar", grupo: "juego", estado: true, params: ["usuario", "cantidad"], description: "Apuesta monedas a doble o nada. Admite 'todo'." },
  { name: "duelo", grupo: "juego", estado: true, params: ["retador", "retado", "monedas?"], description: "Duelo por estadísticas y equipo." },
  { name: "robar", grupo: "juego", estado: true, params: ["usuario", "victima"], description: "Intenta robar. 40 % de éxito, multa si fallas." },
  { name: "ruleta", grupo: "juego", estado: true, params: ["usuario"], description: "Gira la ruleta de premios y castigos." },
  { name: "ruletarusa", grupo: "juego", estado: true, params: ["usuario"], description: "1 bala entre 6. Gana o pierde monedas." },
  { name: "stats", grupo: "juego", estado: true, params: ["usuario"], description: "Tu récord de victorias y derrotas en duelos." },
];

/**
 * Los valores por omisión se rellenan aquí y no en cada entrada: con 55
 * comandos, repetir `estado: false, publico: true` cincuenta veces es una
 * invitación a que una línea se quede sin el campo y nadie lo vea.
 */
export const comandos = CRUDO.map((c) => ({
  ...c,
  estado: c.estado ?? false,
  publico: c.publico ?? !(c.estado ?? false),
}));

/** Lo que se anuncia: portada y `/api/comandos`. */
export const comandosPublicos = comandos.filter((c) => c.publico);

/** Lo que existe pero no se anuncia. Documentado sólo en el README. */
export const comandosPrivados = comandos.filter((c) => !c.publico);

/** Comandos de un grupo, respetando el filtro de visibilidad. */
export function porGrupo(lista = comandosPublicos) {
  return GRUPOS.map((g) => ({
    ...g,
    comandos: lista.filter((c) => c.grupo === g.id),
  })).filter((g) => g.comandos.length > 0);
}

/**
 * Ejemplo de integración con Nightbot para un comando concreto.
 *
 * Nightbot sólo tiene UNA variable con el resto del mensaje, `$(querystring)`.
 * Repartirla entre varios parámetros la duplicaría: `!mercado comprar Hacha`
 * acabaría mandando `accion=comprar Hacha&item=comprar Hacha`. Por eso, en los
 * comandos que piden más de un dato del chat, todo va en `q` y es el endpoint
 * quien lo parte.
 */
export function ejemploNightbot(comando, base = "https://twitchcomm.vercel.app") {
  const DEL_BOT = new Set(["usuario", "retador"]);
  const partes = [];
  let libres = 0;

  for (const bruto of comando.params) {
    const nombre = bruto.replace("?", "");
    if (DEL_BOT.has(nombre)) partes.push(`${nombre}=$(user)`);
    else libres += 1;
  }

  if (libres === 1) {
    const nombre = comando.params
      .map((p) => p.replace("?", ""))
      .find((n) => !DEL_BOT.has(n));
    partes.push(`${nombre}=$(querystring)`);
  } else if (libres > 1) {
    partes.push("q=$(querystring)");
  }

  const url = `${base}/api/${comando.name}${partes.length ? `?${partes.join("&")}` : ""}`;
  return `!addcom !${comando.name} $(urlfetch ${url})`;
}

export default comandos;
