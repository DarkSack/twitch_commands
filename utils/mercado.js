/**
 * Mercado: comprar, vender, equipar y ver el inventario.
 *
 * Esto existia ya en `functions.js`, pero sin exportar y sin endpoint: 300
 * líneas de código muerto que nadie podía ejecutar. Al revisarlo tenía varios
 * fallos que nunca llegaron a dar la cara precisamente por eso:
 *
 * - `equipar` intentaba desequipar la pieza anterior comparando
 *   `catalogo[cat][nombre]?.tipo === tipo`, pero NINGÚN item del catálogo
 *   tiene la propiedad `tipo` (comprobado: 0 de 50). La comparación era
 *   siempre falsa, así que se podían llevar diez espadas equipadas a la vez.
 * - El tipo se deducía con `.replace("s", "")`, que sustituye la PRIMERA "s":
 *   "accesorios" daba "acceorios".
 * - La oferta diaria se elegía con un `while` sin tope que podía no terminar.
 * - `vender` calculaba `datosItem?.precio * 0.5 || 50`, y con precio 0 el
 *   `||` colaba 50 monedas de la nada.
 * - Comparaba monedas contra un texto formateado ("1.5K"), ya corregido en
 *   `getMonedas`.
 *
 * Toda respuesta es texto plano de una línea: la consume un bot de Twitch.
 */

import { catalogo } from "./const";
import {
  all,
  formatearDinero,
  get,
  obtenerUsuario,
  run,
} from "./functions";

/** Cuántos items ofrece el mercado cada día. */
const ITEMS_POR_DIA = 5;

/** Categorías cuyos items se pueden llevar puestos, una de cada. */
const EQUIPABLES = ["armas", "armaduras", "amuletos", "accesorios", "mascotas"];

const PROBABILIDAD_RAREZA = {
  Común: 0.5,
  Raro: 0.3,
  Épico: 0.15,
  Legendario: 0.05,
};

let cacheOferta = null;
let cacheFecha = null;

/** Todos los items del catálogo como [nombre, datos, categoria]. */
function catalogoPlano() {
  return Object.entries(catalogo).flatMap(([categoria, items]) =>
    Object.entries(items).map(([nombre, datos]) => [nombre, datos, categoria])
  );
}

/**
 * Normaliza para comparar: minúsculas y sin tildes.
 *
 * Nadie escribe "Cinturón de Fuerza" con tilde en el chat, y la mitad de los
 * items del catálogo llevan una. Con comparación exacta, "!mercado comprar
 * cinturon de fuerza" respondía que el item no existe.
 */
function normalizar(texto) {
  return String(texto ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Busca un item por nombre, sin distinguir mayúsculas ni tildes. */
export function buscarItem(nombre) {
  if (!nombre) return null;
  const buscado = normalizar(nombre);
  const encontrado = catalogoPlano().find(([n]) => normalizar(n) === buscado);
  if (!encontrado) return null;
  const [nombreReal, datos, categoria] = encontrado;
  return { nombre: nombreReal, ...datos, categoria };
}

/**
 * Oferta del día.
 *
 * El bucle original era `while (seleccionados.length < 5)` sin límite: si la
 * lotería de rarezas no acertaba, giraba indefinidamente dentro de una
 * petición HTTP. Ahora tiene un tope de intentos y, si se agota, rellena con
 * lo que haya para devolver siempre algo.
 *
 * OJO: la caché vive en memoria del proceso. En serverless cada instancia
 * tiene la suya, así que dos espectadores pueden ver mercados distintos el
 * mismo día. Se arregla solo cuando la persistencia salga de SQLite local.
 */
export function ofertaDelDia(hoy = new Date().toISOString().slice(0, 10)) {
  if (cacheOferta && cacheFecha === hoy) return cacheOferta;

  const items = catalogoPlano();
  const elegidos = [];
  const MAX_INTENTOS = 500;

  for (let i = 0; i < MAX_INTENTOS && elegidos.length < ITEMS_POR_DIA; i += 1) {
    const [nombre, datos, categoria] = items[Math.floor(Math.random() * items.length)];
    const probabilidad = PROBABILIDAD_RAREZA[datos.rareza] ?? 0.25;
    if (Math.random() < probabilidad && !elegidos.some((e) => e.nombre === nombre)) {
      elegidos.push({ nombre, ...datos, categoria });
    }
  }

  // Red de seguridad: si la lotería fue esquiva, se completa sin sorteo.
  for (const [nombre, datos, categoria] of items) {
    if (elegidos.length >= ITEMS_POR_DIA) break;
    if (!elegidos.some((e) => e.nombre === nombre)) {
      elegidos.push({ nombre, ...datos, categoria });
    }
  }

  cacheOferta = elegidos;
  cacheFecha = hoy;
  return cacheOferta;
}

/** Precio de recompra: la mitad, redondeada, y nunca negativo. */
export function precioVenta(item) {
  return Math.max(0, Math.floor((item?.precio ?? 0) / 2));
}

async function ver(usuario) {
  const monedas = (await obtenerUsuario(usuario)).dinero;
  const lista = ofertaDelDia()
    .map(
      (i) =>
        `${i.nombre} (${i.rareza}, ${i.precio}💰 · atk ${i.ataque}/def ${i.defensa})`
    )
    .join(" — ");
  return `🏬 Mercado de hoy: ${lista}. Tienes ${formatearDinero(monedas)}💰. Compra con !mercado comprar <item>`;
}

async function comprar(usuario, nombreItem) {
  if (!nombreItem) return "❌ Di qué comprar: !mercado comprar <item>";

  const enOferta = ofertaDelDia().find(
    (i) => normalizar(i.nombre) === normalizar(nombreItem)
  );
  if (!enOferta) return `❌ "${nombreItem}" no está hoy en el mercado. Mira !mercado`;

  const { dinero } = await obtenerUsuario(usuario);
  if (dinero < enOferta.precio) {
    return `❌ ${usuario}, te faltan ${enOferta.precio - dinero}💰 para ${enOferta.nombre}.`;
  }

  await run("UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?", [
    enOferta.precio,
    usuario,
  ]);
  await run(
    `INSERT INTO inventario (usuario, item, cantidad, equipado) VALUES (?, ?, 1, 0)
       ON CONFLICT(usuario, item) DO UPDATE SET cantidad = cantidad + 1`,
    [usuario, enOferta.nombre]
  );

  if (enOferta.evolucion) {
    await run(
      "INSERT OR IGNORE INTO mascotas (usuario, nombre, nivel, hambre) VALUES (?, ?, 1, 100)",
      [usuario, enOferta.nombre]
    );
  }

  return `✅ ${usuario} compró ${enOferta.nombre} por ${enOferta.precio}💰. Le quedan ${formatearDinero(dinero - enOferta.precio)}💰. Equípalo con !mercado equipar ${enOferta.nombre}`;
}

async function vender(usuario, nombreItem) {
  if (!nombreItem) return "❌ Di qué vender: !mercado vender <item>";

  const item = buscarItem(nombreItem);
  if (!item) return `❌ "${nombreItem}" no existe en el catálogo.`;

  const fila = await get(
    "SELECT cantidad, equipado FROM inventario WHERE usuario = ? AND item = ?",
    [usuario, item.nombre]
  );
  if (!fila || fila.cantidad < 1) {
    return `❌ ${usuario}, no tienes ${item.nombre} en el inventario.`;
  }

  const precio = precioVenta(item);
  await run("UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?", [
    precio,
    usuario,
  ]);
  // Solo baja la cantidad. NO se pone `equipado = 0`: si tienes dos y vendes
  // una, te queda una y seguirla llevando puesta es lo esperado. Comprobado
  // contra Turso: con `equipado = 0` el perfil pasaba a "Equipado: nada"
  // teniendo el item todavia en el inventario. Cuando la ultima unidad se va,
  // la fila entera se borra justo debajo, asi que el flag se va con ella.
  await run(
    "UPDATE inventario SET cantidad = cantidad - 1 WHERE usuario = ? AND item = ?",
    [usuario, item.nombre]
  );
  await run(
    "DELETE FROM inventario WHERE usuario = ? AND item = ? AND cantidad <= 0",
    [usuario, item.nombre]
  );
  if (item.evolucion) {
    await run("DELETE FROM mascotas WHERE usuario = ? AND nombre = ?", [
      usuario,
      item.nombre,
    ]);
  }

  const { dinero } = await obtenerUsuario(usuario);
  return `💸 ${usuario} vendió ${item.nombre} por ${precio}💰. Saldo: ${formatearDinero(dinero)}💰`;
}

async function equipar(usuario, nombreItem) {
  if (!nombreItem) return "❌ Di qué equipar: !mercado equipar <item>";

  const item = buscarItem(nombreItem);
  if (!item) return `❌ "${nombreItem}" no existe en el catálogo.`;
  if (!EQUIPABLES.includes(item.categoria)) {
    return `❌ ${item.nombre} no se puede equipar.`;
  }

  const fila = await get(
    "SELECT cantidad, equipado FROM inventario WHERE usuario = ? AND item = ?",
    [usuario, item.nombre]
  );
  if (!fila || fila.cantidad < 1) {
    return `❌ ${usuario}, no tienes ${item.nombre}. Cómpralo con !mercado comprar ${item.nombre}`;
  }
  if (fila.equipado) return `ℹ️ ${item.nombre} ya lo llevas puesto.`;

  // Una pieza por categoría: se desequipa lo que hubiera de la misma. Esto es
  // lo que antes no funcionaba, porque comparaba contra una propiedad `tipo`
  // que ningún item tiene.
  const puestos = await all(
    "SELECT item FROM inventario WHERE usuario = ? AND equipado = 1",
    [usuario]
  );
  const mismaCategoria = puestos
    .map((p) => buscarItem(p.item))
    .filter((i) => i && i.categoria === item.categoria);

  for (const anterior of mismaCategoria) {
    await run(
      "UPDATE inventario SET equipado = 0 WHERE usuario = ? AND item = ?",
      [usuario, anterior.nombre]
    );
  }

  await run(
    "UPDATE inventario SET equipado = 1 WHERE usuario = ? AND item = ?",
    [usuario, item.nombre]
  );

  const cambio = mismaCategoria.length
    ? ` (guardó ${mismaCategoria.map((i) => i.nombre).join(", ")})`
    : "";
  return `🗡️ ${usuario} equipó ${item.nombre}: +${item.ataque} atk, +${item.defensa} def${cambio}`;
}

async function desequipar(usuario, nombreItem) {
  if (!nombreItem) return "❌ Di qué quitarte: !mercado desequipar <item>";
  const item = buscarItem(nombreItem);
  if (!item) return `❌ "${nombreItem}" no existe en el catálogo.`;

  const res = await run(
    "UPDATE inventario SET equipado = 0 WHERE usuario = ? AND item = ? AND equipado = 1",
    [usuario, item.nombre]
  );
  return res.changes > 0
    ? `🎒 ${usuario} guardó ${item.nombre}.`
    : `ℹ️ ${usuario} no llevaba puesto ${item.nombre}.`;
}

/**
 * Punto de entrada del comando `!mercado`.
 *
 * Acciones: ver (por defecto), comprar, vender, equipar, desequipar.
 */
export async function gestionarMercado(usuario, accion, item) {
  const que = (accion || "ver").toLowerCase();

  switch (que) {
    case "ver":
      return ver(usuario);
    case "comprar":
      return comprar(usuario, item);
    case "vender":
      return vender(usuario, item);
    case "equipar":
      return equipar(usuario, item);
    case "desequipar":
    case "quitar":
      return desequipar(usuario, item);
    default:
      return `❌ Acción "${accion}" desconocida. Usa: ver, comprar, vender, equipar, desequipar.`;
  }
}

/** Inventario del usuario, en una línea. */
export async function verInventario(usuario) {
  const filas = await all(
    "SELECT item, cantidad, equipado FROM inventario WHERE usuario = ? AND cantidad > 0 ORDER BY equipado DESC, item",
    [usuario]
  );
  const { dinero } = await obtenerUsuario(usuario);

  if (filas.length === 0) {
    return `🎒 ${usuario} no tiene nada. Saldo: ${formatearDinero(dinero)}💰. Mira !mercado`;
  }

  const lista = filas
    .map(
      (f) =>
        `${f.equipado ? "✅" : "▫️"}${f.item}${f.cantidad > 1 ? ` x${f.cantidad}` : ""}`
    )
    .join(", ");
  return `🎒 ${usuario}: ${lista} — ${formatearDinero(dinero)}💰`;
}
