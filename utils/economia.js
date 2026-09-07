/**
 * Comandos de economía y progreso.
 *
 * Todo devuelve una cadena de una sola línea: lo consume un bot de Twitch que
 * la pega tal cual en el chat.
 *
 * Los cooldowns se guardan en la propia tabla `usuarios` (`ultimoTrabajo`,
 * `ultimaRecompensa`) en vez de en memoria: en serverless cada instancia
 * tiene su propio proceso, así que un cooldown en una variable global no
 * frena a nadie.
 */

import { catalogo } from "./const";
import { all, formatearDinero, get, obtenerUsuario, run } from "./functions";

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** Trabajos disponibles: nombre, paga mínima y máxima, energía que cuesta. */
const TRABAJOS = [
  { nombre: "repartir pizzas", min: 60, max: 180, energia: 10 },
  { nombre: "moderar un chat ajeno", min: 80, max: 200, energia: 8 },
  { nombre: "hacer speedrun por encargo", min: 120, max: 300, energia: 15 },
  { nombre: "pasear perros", min: 50, max: 150, energia: 12 },
  { nombre: "montar PCs", min: 150, max: 400, energia: 20 },
  { nombre: "traducir subtítulos", min: 70, max: 190, energia: 6 },
  { nombre: "vender skins", min: 40, max: 500, energia: 5 },
];

function tiempoRestante(ms) {
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.ceil(min / 60)} h`;
}

/* ── !trabajar ──────────────────────────────────────────────────── */

export async function trabajar(usuario) {
  const datos = await obtenerUsuario(usuario);
  const fila = await get(
    "SELECT ultimoTrabajo, energia FROM usuarios WHERE nombre = ?",
    [usuario]
  );

  const desde = Date.now() - (fila?.ultimoTrabajo || 0);
  if (desde < HORA) {
    return `⏳ ${usuario}, estás agotado. Vuelve a trabajar en ${tiempoRestante(HORA - desde)}.`;
  }

  const trabajo = TRABAJOS[Math.floor(Math.random() * TRABAJOS.length)];
  if ((fila?.energia ?? 0) < trabajo.energia) {
    return `😴 ${usuario}, no te queda energía (${fila?.energia ?? 0}). Descansa con !dormir`;
  }

  const paga = Math.floor(
    trabajo.min + Math.random() * (trabajo.max - trabajo.min)
  );

  await run(
    "UPDATE usuarios SET dinero = dinero + ?, energia = MAX(0, energia - ?), ultimoTrabajo = ? WHERE nombre = ?",
    [paga, trabajo.energia, Date.now(), usuario]
  );

  return `💼 ${usuario} se puso a ${trabajo.nombre} y ganó ${paga}💰 (−${trabajo.energia} energía). Saldo: ${formatearDinero(datos.dinero + paga)}💰`;
}

/* ── !diario ────────────────────────────────────────────────────── */

export async function recompensaDiaria(usuario) {
  await obtenerUsuario(usuario);
  const fila = await get(
    "SELECT ultimaRecompensa, racha FROM usuarios WHERE nombre = ?",
    [usuario]
  );

  const ultima = fila?.ultimaRecompensa || 0;
  const desde = Date.now() - ultima;
  if (desde < DIA) {
    return `⏳ ${usuario}, ya cobraste hoy. Vuelve en ${tiempoRestante(DIA - desde)}.`;
  }

  // La racha se mantiene si vuelve antes de 48 h; si no, empieza de cero.
  const racha = desde < 2 * DIA ? (fila?.racha || 0) + 1 : 1;
  const base = 200;
  const bonus = Math.min(racha, 7) * 50;
  const total = base + bonus;

  await run(
    "UPDATE usuarios SET dinero = dinero + ?, ultimaRecompensa = ?, racha = ? WHERE nombre = ?",
    [total, Date.now(), racha, usuario]
  );

  const { dinero } = await obtenerUsuario(usuario);
  return `🎁 ${usuario} cobró ${total}💰 (racha de ${racha} día${racha === 1 ? "" : "s"}, +${bonus} de bonus). Saldo: ${formatearDinero(dinero)}💰`;
}

/* ── !dormir ────────────────────────────────────────────────────── */

export async function dormir(usuario) {
  const datos = await obtenerUsuario(usuario);
  if (datos.energia >= 100) {
    return `☀️ ${usuario} ya está a tope de energía (100).`;
  }
  const recuperada = Math.min(100 - datos.energia, 30 + Math.floor(Math.random() * 30));
  await run(
    "UPDATE usuarios SET energia = MIN(100, energia + ?), estres = MAX(0, estres - 10) WHERE nombre = ?",
    [recuperada, usuario]
  );
  return `😴 ${usuario} durmió y recuperó ${recuperada} de energía (ahora ${datos.energia + recuperada}) y bajó 10 de estrés.`;
}

/* ── !perfil ────────────────────────────────────────────────────── */

export async function verPerfil(usuario) {
  const d = await obtenerUsuario(usuario);
  const equipo = await all(
    "SELECT item FROM inventario WHERE usuario = ? AND equipado = 1",
    [usuario]
  );
  const puesto = equipo.length ? equipo.map((e) => e.item).join(", ") : "nada";

  return `👤 ${usuario} — ${formatearDinero(d.dinero)}💰 | ❤️${d.salud} ⚡${d.energia} 😊${d.felicidad} 🧠${d.inteligencia} 😰${d.estres} | ${d.edad} años, ${d.profesion} | Equipado: ${puesto}`;
}

/* ── !ranking ───────────────────────────────────────────────────── */

export async function verRanking(limite = 5) {
  const filas = await all(
    "SELECT nombre, dinero FROM usuarios ORDER BY dinero DESC LIMIT ?",
    [limite]
  );
  if (filas.length === 0) return "📊 Todavía no juega nadie. Empieza con !diario";

  const medallas = ["🥇", "🥈", "🥉"];
  const lista = filas
    .map((f, i) => `${medallas[i] || `${i + 1}.`} ${f.nombre} ${formatearDinero(f.dinero)}💰`)
    .join(" · ");
  return `📊 Top monedas: ${lista}`;
}

/* ── !stats (duelos) ────────────────────────────────────────────── */

export async function verStatsDuelos(usuario) {
  const fila = await get(
    "SELECT victorias, derrotas FROM duelos_stats WHERE usuario = ?",
    [usuario]
  );
  if (!fila) return `⚔️ ${usuario} todavía no ha peleado. Reta a alguien con !duelo`;

  const v = fila.victorias || 0;
  const d = fila.derrotas || 0;
  const total = v + d;
  const ratio = total ? Math.round((v / total) * 100) : 0;
  return `⚔️ ${usuario}: ${v}V — ${d}D en ${total} duelos (${ratio}% de victorias)`;
}

/* ── !regalar ───────────────────────────────────────────────────── */

export async function regalar(origen, destino, cantidadBruta) {
  if (origen === destino) return "❌ No puedes regalarte monedas a ti mismo.";

  const cantidad = Math.floor(Number(cantidadBruta));
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return "❌ Di cuánto: !regalar @usuario 100";
  }

  const datosOrigen = await obtenerUsuario(origen);
  if (datosOrigen.dinero < cantidad) {
    return `❌ ${origen}, solo tienes ${formatearDinero(datosOrigen.dinero)}💰.`;
  }
  await obtenerUsuario(destino);

  // Las dos escrituras van en una transacción: sin ella, un fallo entre medias
  // haría desaparecer las monedas del origen sin que llegaran al destino.
  await run("BEGIN IMMEDIATE");
  try {
    await run("UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?", [
      cantidad,
      origen,
    ]);
    await run("UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?", [
      cantidad,
      destino,
    ]);
    await run("COMMIT");
  } catch (err) {
    await run("ROLLBACK");
    throw err;
  }

  return `🎁 ${origen} le regaló ${cantidad}💰 a ${destino}. Le quedan ${formatearDinero(datosOrigen.dinero - cantidad)}💰`;
}

/* ── !apostar ───────────────────────────────────────────────────── */

export async function apostar(usuario, cantidadBruta) {
  const datos = await obtenerUsuario(usuario);

  const texto = String(cantidadBruta ?? "").trim().toLowerCase();
  const cantidad =
    texto === "todo" || texto === "all"
      ? datos.dinero
      : Math.floor(Number(texto));

  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return "❌ Di cuánto apostar: !apostar 100 (o !apostar todo)";
  }
  if (datos.dinero < cantidad) {
    return `❌ ${usuario}, solo tienes ${formatearDinero(datos.dinero)}💰.`;
  }

  const gano = Math.random() < 0.5;
  const delta = gano ? cantidad : -cantidad;
  await run("UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?", [
    delta,
    usuario,
  ]);

  const saldo = formatearDinero(datos.dinero + delta);
  return gano
    ? `🎉 ${usuario} ganó ${cantidad}💰. Saldo: ${saldo}💰`
    : `😢 ${usuario} perdió ${cantidad}💰. Saldo: ${saldo}💰`;
}

/* ── !robar ─────────────────────────────────────────────────────── */

export async function robar(ladron, victima) {
  if (ladron === victima) return "❌ Robarte a ti mismo no cuenta.";

  const datosLadron = await obtenerUsuario(ladron);
  const datosVictima = await obtenerUsuario(victima);

  if (datosVictima.dinero < 50) {
    return `🪶 ${victima} está tieso, no le sacas nada.`;
  }
  if (datosLadron.energia < 15) {
    return `😴 ${ladron}, no tienes energía para eso. Prueba !dormir`;
  }

  // 40 % de éxito. Al fallar hay multa, para que no sea gratis intentarlo.
  const exito = Math.random() < 0.4;
  await run("UPDATE usuarios SET energia = MAX(0, energia - 15) WHERE nombre = ?", [
    ladron,
  ]);

  if (!exito) {
    const multa = Math.min(datosLadron.dinero, 100);
    await run("UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?", [
      multa,
      ladron,
    ]);
    return `🚨 ${ladron} intentó robar a ${victima}, lo pillaron y pagó ${multa}💰 de multa.`;
  }

  const botin = Math.floor(datosVictima.dinero * (0.05 + Math.random() * 0.15));
  await run("BEGIN IMMEDIATE");
  try {
    await run("UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?", [
      botin,
      victima,
    ]);
    await run("UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?", [
      botin,
      ladron,
    ]);
    await run("COMMIT");
  } catch (err) {
    await run("ROLLBACK");
    throw err;
  }

  return `🥷 ${ladron} le robó ${botin}💰 a ${victima} y salió corriendo.`;
}

/* ── !catalogo ──────────────────────────────────────────────────── */

export function verCatalogo(categoria) {
  const cats = Object.keys(catalogo);
  const pedida = String(categoria ?? "").trim().toLowerCase();

  if (!pedida) {
    return `📖 Categorías: ${cats.join(", ")}. Mira una con !catalogo <categoría>`;
  }
  const clave = cats.find((c) => c.toLowerCase() === pedida);
  if (!clave) {
    return `❌ "${categoria}" no existe. Categorías: ${cats.join(", ")}`;
  }

  const items = Object.entries(catalogo[clave])
    .map(([nombre, d]) => `${nombre} (${d.precio}💰)`)
    .join(", ");
  return `📖 ${clave}: ${items}`;
}
