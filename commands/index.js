/**
 * Catálogo de comandos.
 *
 * Antes este fichero no lo importaba nadie y le faltaban 8 de los 14 comandos
 * que existían. Ahora es la fuente única: lo sirve `/api/comandos` y lo pinta
 * la portada, así que si se añade un endpoint sin apuntarlo aquí, se nota.
 *
 * `estado: true` significa que el comando lee o escribe en la base de datos.
 */
export const comandos = [
  // ── Sin estado ────────────────────────────────────────────────
  { name: "8ball", estado: false, params: [], description: "Bola 8 mágica: responde a lo que le preguntes." },
  { name: "adivinanza", estado: false, params: [], description: "Una adivinanza con su pista." },
  { name: "animal", estado: false, params: [], description: "Un animal inventado, en texto." },
  { name: "catalogo", estado: false, params: ["categoria?"], description: "Los items que existen, por categoría." },
  { name: "comandos", estado: false, params: [], description: "Esta misma lista." },
  { name: "cumplido", estado: false, params: [], description: "Un cumplido al azar." },
  { name: "dado", estado: false, params: ["tirada?"], description: "Tira dados: !dado, !dado d20, !dado 2d6+3." },
  { name: "facha", estado: false, params: [], description: "Tu porcentaje de facha." },
  { name: "factos", estado: false, params: [], description: "Un dato curioso." },
  { name: "flip", estado: false, params: [], description: "Cara o cruz." },
  { name: "insulto", estado: false, params: [], description: "Un insulto en tono cómico." },
  { name: "memide", estado: false, params: [], description: "Una medida con emoji." },
  { name: "superhero", estado: false, params: [], description: "Un superhéroe inventado." },

  // ── Con estado ────────────────────────────────────────────────
  { name: "apostar", estado: true, params: ["usuario", "cantidad"], description: "Apuesta monedas a doble o nada. Admite 'todo'." },
  { name: "diario", estado: true, params: ["usuario"], description: "Recompensa diaria, con bonus por racha." },
  { name: "dormir", estado: true, params: ["usuario"], description: "Recupera energía y baja el estrés." },
  { name: "duelo", estado: true, params: ["retador", "retado", "monedas?"], description: "Duelo por estadísticas y equipo." },
  { name: "inventario", estado: true, params: ["usuario"], description: "Lo que tienes y lo que llevas puesto." },
  { name: "mercado", estado: true, params: ["usuario", "accion?", "item?"], description: "ver, comprar, vender, equipar, desequipar." },
  { name: "perfil", estado: true, params: ["usuario"], description: "Tus estadísticas y tu equipo." },
  { name: "ranking", estado: true, params: ["top?"], description: "Top de monedas del canal." },
  { name: "regalar", estado: true, params: ["usuario", "destino", "cantidad"], description: "Regala monedas a otro chatter." },
  { name: "robar", estado: true, params: ["usuario", "victima"], description: "Intenta robar. 40 % de éxito, multa si fallas." },
  { name: "ruleta", estado: true, params: ["usuario"], description: "Gira la ruleta de premios y castigos." },
  { name: "ruletarusa", estado: true, params: ["usuario"], description: "1 bala entre 6. Gana o pierde monedas." },
  { name: "stats", estado: true, params: ["usuario"], description: "Tu récord de victorias y derrotas en duelos." },
  { name: "trabajar", estado: true, params: ["usuario"], description: "Trabaja por monedas. Una vez por hora." },
];

/**
 * Ejemplo de integración con Nightbot para un comando concreto.
 *
 * Nightbot solo tiene UNA variable con el resto del mensaje, `$(querystring)`.
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
