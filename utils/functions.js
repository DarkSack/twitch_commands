import { createClient } from "@libsql/client";
import { premios, eventos, catalogo } from "./const";

/* ── Base de datos ────────────────────────────────────────────────
   Se pasa de `sqlite3` a `@libsql/client`.

   El motivo no es preferencia: `sqlite3` escribe en un fichero del disco, y
   en Vercel el sistema de ficheros es de solo lectura salvo /tmp, que es
   propio de cada instancia y se destruye sola. Con 14 comandos de economia
   eso no era una limitacion, era que las monedas, el inventario, las rachas
   y el ranking desaparecian sin dar ningun error.

   libSQL habla el MISMO SQL que SQLite, asi que ninguna consulta cambia, y
   el mismo cliente sirve para los dos casos:
     - `file:` en local, sin cuenta ni red
     - `libsql://` contra Turso en produccion, con persistencia de verdad

   Un solo camino de codigo en vez de dos implementaciones que se desincronizan.
*/

const URL_TURSO = process.env.TURSO_DATABASE_URL;
const TOKEN_TURSO = process.env.TURSO_AUTH_TOKEN;

/** Fichero local cuando no hay Turso configurado. */
const FICHERO_LOCAL = `file:${process.env.DATABASE_PATH || "./database.db"}`;

export const usandoTurso = Boolean(URL_TURSO);

const db = createClient(
  usandoTurso
    ? { url: URL_TURSO, authToken: TOKEN_TURSO }
    : { url: FICHERO_LOCAL }
);

if (!usandoTurso && process.env.NODE_ENV === "production") {
  // Aviso explicito: es exactamente el fallo que motivo esta migracion, y sin
  // este mensaje volveria a pasar desapercibido hasta que alguien reclamara
  // sus monedas.
  console.warn(
    "[db] TURSO_DATABASE_URL no esta configurada: se usa un fichero local. " +
      "En serverless eso significa que los datos NO se guardan."
  );
}

/* ── Envoltorios ──────────────────────────────────────────────────
   Mantienen la firma de antes (`sql, params`) para que el resto del fichero
   no cambie, pero por debajo es `client.execute`, que ya devuelve promesas:
   se acabaron las piramides de callbacks. */

export async function run(sql, params = []) {
  await esquemaListo;
  const r = await db.execute({ sql, args: params });
  // `changes` imita a sqlite3, que es lo que espera quien ya lo usaba.
  return { changes: Number(r.rowsAffected ?? 0), lastID: r.lastInsertRowid };
}

export async function get(sql, params = []) {
  await esquemaListo;
  const r = await db.execute({ sql, args: params });
  return r.rows[0];
}

export async function all(sql, params = []) {
  await esquemaListo;
  const r = await db.execute({ sql, args: params });
  return r.rows;
}

/** Igual que `run`, pero sin esperar al esquema: lo usa el propio arranque. */
async function runCrudo(sql, params = []) {
  return db.execute({ sql, args: params });
}

/**
 * Varias sentencias como una sola unidad.
 *
 * Sustituye a los `BEGIN IMMEDIATE` / `COMMIT` manuales: con un cliente HTTP
 * cada sentencia suelta puede ir por una conexion distinta, asi que una
 * transaccion abierta a mano no garantiza nada. `batch` con modo "write" si.
 */
export async function transaccion(sentencias) {
  await esquemaListo;
  return db.batch(
    sentencias.map(([sql, args = []]) => ({ sql, args })),
    "write"
  );
}

/* ── Esquema ──────────────────────────────────────────────────────
   Se crea una sola vez y todo lo demas espera a `esquemaListo`.

   Antes eran `db.run(...)` sueltos al cargar el modulo y sqlite3 no los
   serializaba: el `ALTER TABLE inventario` llegaba a ejecutarse ANTES que su
   `CREATE TABLE` y moria con "no such table". Aqui el orden es el del
   `await`, que no admite discusion. */

const esquemaListo = (async () => {
  await runCrudo(`
    CREATE TABLE IF NOT EXISTS usuarios (
        nombre TEXT PRIMARY KEY,
        dinero INTEGER DEFAULT 1000,
        felicidad INTEGER DEFAULT 50,
        salud INTEGER DEFAULT 50,
        social INTEGER DEFAULT 50,
        inteligencia INTEGER DEFAULT 50,
        energia INTEGER DEFAULT 100,
        estres INTEGER DEFAULT 0,
        edad INTEGER DEFAULT 18,
        profesion TEXT DEFAULT 'Desempleado',
        diasVividos INTEGER DEFAULT 0,
        ultimoEvento INTEGER DEFAULT 0
    )`);

  await runCrudo(`
    CREATE TABLE IF NOT EXISTS inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        item TEXT,
        cantidad INTEGER DEFAULT 1,
        FOREIGN KEY(usuario) REFERENCES usuarios(nombre)
    )`);

  // Columnas anadidas despues. SQLite no tiene ADD COLUMN IF NOT EXISTS, asi
  // que se intenta y se ignora el error de columna repetida.
  for (const [tabla, columna, tipo] of [
    ["inventario", "equipado", "INTEGER DEFAULT 0"],
    ["usuarios", "ultimoTrabajo", "INTEGER DEFAULT 0"],
    ["usuarios", "ultimaRecompensa", "INTEGER DEFAULT 0"],
    ["usuarios", "racha", "INTEGER DEFAULT 0"],
  ]) {
    try {
      await runCrudo(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${tipo}`);
    } catch (err) {
      if (!/duplicate column/i.test(err.message)) {
        console.error(`Migracion ${tabla}.${columna}:`, err.message);
      }
    }
  }

  // Estar equipado se guardaba renombrando la fila a "Espada (Equipado)": eso
  // rompia el ON CONFLICT y duplicaba filas. Se recupera lo antiguo.
  await runCrudo(
    "UPDATE inventario SET equipado = 1, item = REPLACE(item, ' (Equipado)', '') WHERE item LIKE '%(Equipado)'"
  );

  // Sin este indice el ON CONFLICT(usuario, item) del mercado falla. Se
  // limpian antes los duplicados o la creacion del indice se cae.
  await runCrudo(`
    DELETE FROM inventario WHERE id NOT IN (
      SELECT MIN(id) FROM inventario GROUP BY usuario, item
    )`);
  await runCrudo(`
    CREATE UNIQUE INDEX IF NOT EXISTS inventario_usuario_item
        ON inventario (usuario, item)`);

  await runCrudo(`
    CREATE TABLE IF NOT EXISTS mascotas (
        usuario TEXT NOT NULL,
        nombre  TEXT NOT NULL,
        nivel   INTEGER DEFAULT 1,
        hambre  INTEGER DEFAULT 100,
        PRIMARY KEY (usuario, nombre)
    )`);

  await runCrudo(`
    CREATE TABLE IF NOT EXISTS duelos_stats (
        usuario TEXT PRIMARY KEY,
        victorias INTEGER DEFAULT 0,
        derrotas INTEGER DEFAULT 0,
        monedas_ganadas INTEGER DEFAULT 0,
        ultimo_duelo TIMESTAMP
    )`);

  await runCrudo(`
    CREATE TABLE IF NOT EXISTS duelos_historial (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        retador TEXT,
        retado TEXT,
        ganador TEXT,
        tipo_victoria TEXT,
        monedas_apostadas INTEGER,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
})();

export { esquemaListo };

export function formatearDinero(cantidad) {
  if (cantidad >= 1_000_000_000) {
    return (cantidad / 1_000_000_000).toFixed(2) + "B";
  } else if (cantidad >= 1_000_000) {
    return (cantidad / 1_000_000).toFixed(2) + "M";
  } else if (cantidad >= 1_000) {
    return (cantidad / 1_000).toFixed(1) + "K";
  }
  return cantidad.toString();
}

//Funciones 🛠️
const COLUMNAS_USUARIO =
  "nombre, diasVividos, ultimoEvento, dinero, felicidad, salud, social, inteligencia, energia, estres, edad, profesion";

/**
 * Devuelve el usuario, creandolo si es la primera vez que aparece.
 *
 * `ultimoEvento` arranca en 0 y no en Date.now(): con la hora actual, el
 * usuario recien creado ya estaba en cooldown y su primer !duelo se rechazaba
 * siempre. Y el SELECT incluye `nombre`, que faltaba en la version anterior
 * para el usuario nuevo y hacia que el duelo narrara "undefined VS undefined".
 */
export async function obtenerUsuario(nombre) {
  const existente = await get(
    `SELECT ${COLUMNAS_USUARIO} FROM usuarios WHERE nombre = ?`,
    [nombre]
  );
  if (existente) return existente;

  await run(
    `INSERT INTO usuarios (
       nombre, dinero, felicidad, salud, social, inteligencia,
       energia, estres, edad, profesion, diasVividos, ultimoEvento
     ) VALUES (?, 1000, 50, 50, 50, 50, 100, 0, 18, 'Desempleado', 0, 0)
     ON CONFLICT(nombre) DO NOTHING`,
    [nombre]
  );

  return get(`SELECT ${COLUMNAS_USUARIO} FROM usuarios WHERE nombre = ?`, [
    nombre,
  ]);
}

export async function actualizarUsuario(nombre, datos) {
  await run(
    `UPDATE usuarios SET
        dinero = ?, felicidad = ?, salud = ?, social = ?, inteligencia = ?,
        energia = ?, estres = ?, edad = ?, profesion = ?, diasVividos = ?,
        ultimoEvento = ?
      WHERE nombre = ?`,
    [
      datos.dinero, datos.felicidad, datos.salud, datos.social,
      datos.inteligencia, datos.energia, datos.estres, datos.edad,
      datos.profesion, datos.diasVividos, datos.ultimoEvento, nombre,
    ]
  );
}

// Función auxiliar para generar eventos aleatorios
export function generarEvento(profesion) {
  const eventosValidos = eventos.filter(
    (evento) => !evento.requiereTrabajo || profesion !== "Desempleado"
  );
  return eventosValidos[Math.floor(Math.random() * eventosValidos.length)];
}

/**
 * Monedas del usuario, como NUMERO.
 *
 * Antes devolvia el resultado de `formatearDinero`, o sea texto tipo "1.5K", y
 * quien llamaba lo comparaba con `<`: `"1.5K" < 500` es siempre false porque
 * compara texto contra numero. Eso dejaba sin efecto la comprobacion de saldo
 * en los duelos apostados y en las compras del mercado.
 *
 * El formateo es cosa de quien muestra el dato, no de quien lo consulta.
 */
export async function getMonedas(usuario) {
  const fila = await get("SELECT dinero FROM usuarios WHERE nombre = ?", [
    usuario,
  ]);
  return Number(fila?.dinero) || 0;
}

export async function getEquipo(usuario) {
  const filas = await all(
    "SELECT item FROM inventario WHERE usuario = ? AND equipado = 1 AND cantidad > 0",
    [usuario]
  );
  return filas.map((f) => f.item);
}

/**
 * Apuesta simple al 50 %.
 *
 * La expone `!apostar` a traves de `utils/economia.js`; se conserva aqui
 * porque es donde vivia y para no romper a quien la importara.
 */
export async function procesarApuesta(usuario, cantidad) {
  const monto = Math.floor(Number(cantidad));
  if (!Number.isFinite(monto) || monto <= 0) {
    return "❌ Debes apostar una cantidad válida de monedas.";
  }

  const { dinero } = await obtenerUsuario(usuario);
  if (dinero < monto) {
    return `❌ ${usuario}, no tienes suficientes monedas para apostar. Tienes ${dinero} monedas.`;
  }

  const gano = Math.random() < 0.5;
  const nuevoSaldo = gano ? dinero + monto : dinero - monto;
  await run("UPDATE usuarios SET dinero = ? WHERE nombre = ?", [
    nuevoSaldo,
    usuario,
  ]);

  return gano
    ? `🎉 ¡Felicidades ${usuario}! Ganaste ${monto} monedas. Ahora tienes ${nuevoSaldo} monedas.`
    : `😢 Lo siento ${usuario}, perdiste ${monto} monedas. Ahora tienes ${nuevoSaldo} monedas.`;
}

/** Aplica un premio del catalogo sobre la fila del usuario. */
function aplicarPremio(row, premio) {
  const acotado = (v) => Math.max(0, Math.min(100, v));
  return {
    dinero: (row.dinero || 0) + (premio.dinero || 0),
    felicidad: acotado((row.felicidad || 0) + (premio.felicidad || 0)),
    salud: acotado((row.salud || 0) + (premio.salud || 0)),
    social: acotado((row.social || 0) + (premio.social || 0)),
    inteligencia: acotado((row.inteligencia || 0) + (premio.inteligencia || 0)),
    energia: acotado((row.energia || 0) + (premio.energia || 0)),
    estres: acotado((row.estres || 0) + (premio.estres || 0)),
    edad: (row.edad || 0) + (premio.edad || 0),
  };
}

/** Guarda los stats de un premio ya calculado. */
async function guardarStats(usuario, v) {
  await run(
    `UPDATE usuarios SET
        dinero = ?, felicidad = ?, salud = ?, social = ?,
        inteligencia = ?, energia = ?, estres = ?, edad = ?
        WHERE nombre = ?`,
    [
      v.dinero, v.felicidad, v.salud, v.social,
      v.inteligencia, v.energia, v.estres, v.edad, usuario,
    ]
  );
}

/**
 * Solo lo que el premio cambio, no el volcado entero de stats.
 *
 * El mensaje va al chat de Twitch, donde caben ~500 caracteres: listar las
 * ocho estadisticas en cada tirada llenaba la linea de ruido.
 */
function resumirCambios(premio, valores) {
  const tocados = Object.keys(premio).filter((k) => k !== "mensaje");
  return tocados.map((k) => `${k}: ${valores[k]}`).join(" | ");
}

export async function girarRuleta(usuario) {
  const premio = premios[Math.floor(Math.random() * premios.length)];

  // Antes se consultaba la tabla directamente y, si el usuario no existia, se
  // respondia "Usuario no encontrado" — o sea SIEMPRE para quien tiraba de la
  // ruleta por primera vez, porque nada lo daba de alta. `obtenerUsuario` lo
  // crea si hace falta, igual que ya hacia el duelo.
  const row = await obtenerUsuario(usuario);
  const valores = aplicarPremio(row, premio);
  await guardarStats(usuario, valores);

  return `${premio.mensaje} 📊 ${resumirCambios(premio, valores)}`;
}

/**
 * Ruleta rusa: aplica el premio de verdad.
 *
 * El endpoint calculaba un premio y no lo guardaba nunca, asi que el comando
 * anunciaba monedas ganadas o perdidas que jamas se movian. Aqui si se
 * escriben. Al perder se aplica el castigo fijo; al ganar, uno de los premios
 * con dinero positivo elegido sobre la longitud REAL de la lista (el codigo
 * anterior sorteaba sobre 3 habiendo solo 2, y un tercio de las victorias
 * reventaba con `undefined`).
 */
export async function aplicarPremioRuletaRusa(usuario, tieneBala) {
  const candidatos = tieneBala
    ? premios.filter((p) => (p.dinero || 0) < 0)
    : premios.filter((p) => (p.dinero || 0) > 0);

  const premio = candidatos[Math.floor(Math.random() * candidatos.length)];
  const row = await obtenerUsuario(usuario);
  const valores = aplicarPremio(row, premio);
  await guardarStats(usuario, valores);

  const cabecera = tieneBala ? "💥 ¡BOOM! Has perdido" : "🎉 ¡Click! Has ganado";
  return `${cabecera} — ${premio.mensaje}. Saldo: ${formatearDinero(valores.dinero)}`;
}

// Función separada para manejar la lógica del duelo
export async function realizarDuelo(retador, retado, monedas) {
  return new Promise((resolve, reject) => {
    const monedasApostadas = parseInt(monedas) || 0;

    if (!retador || !retado) {
      resolve("❌ Debes especificar retador y retado.");
      return;
    }
    if (retador === retado) {
      resolve("❌ No puedes retarte a ti mismo.");
      return;
    }

    obtenerUsuario(retador)
      .then((datosRetador) => {
        obtenerUsuario(retado)
          .then((datosRetado) => {
            // Estaba escrito `5 * 60 * 100` = 30 segundos, mientras el
            // mensaje hablaba de minutos y dividia entre 60000, con lo que
            // siempre decia "espera 1 minutos". Ahora la constante y el texto
            // dicen lo mismo.
            const COOLDOWN_MS = 5 * 60 * 1000;
            const transcurrido = Date.now() - datosRetador.ultimoEvento;
            if (transcurrido < COOLDOWN_MS) {
              const restanteSeg = Math.ceil((COOLDOWN_MS - transcurrido) / 1000);
              const espera =
                restanteSeg >= 60
                  ? `${Math.ceil(restanteSeg / 60)} min`
                  : `${restanteSeg} s`;
              resolve(`❌ ${retador}, espera ${espera} para otro duelo.`);
              return;
            }

            if (monedasApostadas > 0) {
              getMonedas(retador)
                .then((retadorMonedas) => {
                  getMonedas(retado)
                    .then((retadoMonedas) => {
                      if (
                        retadorMonedas < monedasApostadas ||
                        retadoMonedas < monedasApostadas
                      ) {
                        resolve(
                          `❌ ${
                            retadorMonedas < monedasApostadas ? retador : retado
                          } no tiene suficientes monedas.`
                        );
                        return;
                      }
                      // Continuar con el duelo si las monedas son válidas
                      procesarDuelo(datosRetador, datosRetado, monedasApostadas)
                        .then(resolve)
                        .catch(reject);
                    })
                    .catch(reject);
                })
                .catch(reject);
            } else {
              procesarDuelo(datosRetador, datosRetado, monedasApostadas)
                .then(resolve)
                .catch(reject);
            }
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

// Función auxiliar para procesar el duelo
function procesarDuelo(datosRetador, datosRetado, monedasApostadas) {
  return new Promise((resolve, reject) => {
    getEquipo(datosRetador.nombre)
      .then((equipoRetador) => {
        getEquipo(datosRetado.nombre)
          .then((equipoRetado) => {
            const calcularStats = (datos, equipo) => {
              let ataque = datos.inteligencia + datos.energia;
              let defensa = datos.salud;
              let suerte = 0.5;
              equipo.forEach((itemNombre) => {
                const item = Object.values(catalogo)
                  .flatMap((cat) => (cat[itemNombre] ? cat[itemNombre] : null))
                  .filter(Boolean)[0];
                if (item) {
                  ataque += item.ataque;
                  defensa += item.defensa;
                  suerte += item.suerte;
                }
              });
              return { ataque, defensa, suerte: Math.min(1, suerte) };
            };

            const statsRetador = calcularStats(datosRetador, equipoRetador);
            const statsRetado = calcularStats(datosRetado, equipoRetado);

            const criticoRetador = Math.random() < statsRetador.suerte;
            const criticoRetado = Math.random() < statsRetado.suerte;
            const poderRetador =
              statsRetador.ataque * (criticoRetador ? 1.5 : 1) -
              statsRetado.defensa * 0.5;
            const poderRetado =
              statsRetado.ataque * (criticoRetado ? 1.5 : 1) -
              statsRetador.defensa * 0.5;

            // El empate se sorteaba a favor del retado, porque `>` lo manda
            // al `else`. Y el empate NO es raro: dos usuarios nuevos tienen
            // los mismos stats, asi que el que retaba no podia ganar nunca su
            // primer duelo. Con stats iguales se decide a cara o cruz.
            const ganador =
              poderRetador === poderRetado
                ? Math.random() < 0.5
                  ? datosRetador.nombre
                  : datosRetado.nombre
                : poderRetador > poderRetado
                  ? datosRetador.nombre
                  : datosRetado.nombre;
            const perdedor =
              ganador === datosRetador.nombre
                ? datosRetado.nombre
                : datosRetador.nombre;

            const narrativa = [
              `🏆 ¡DUELO ÉPICO! 🏆`,
              `${datosRetador.nombre} (${
                equipoRetador.join(", ") || "Sin equipo"
              }) VS ${datosRetado.nombre} (${
                equipoRetado.join(", ") || "Sin equipo"
              })`,
              `\n⚔️ ROUND 1:`,
              `${datosRetador.nombre} ataca con ${
                criticoRetador ? "¡un golpe crítico!" : "fuerza"
              } (${Math.round(poderRetador)} daño).`,
              `${datosRetado.nombre} responde con ${
                criticoRetado ? "¡un golpe crítico!" : "resistencia"
              } (${Math.round(poderRetado)} daño).`,
              `\n🔥 ROUND FINAL:`,
              `¡${ganador} vence con ${
                poderRetador === poderRetado
                  ? "un desempate de infarto"
                  : "poder abrumador"
              }!`,
            ];

            datosRetador.energia = Math.max(0, datosRetador.energia - 15);
            datosRetado.energia = Math.max(0, datosRetado.energia - 15);
            datosRetador.ultimoEvento = Date.now();
            datosRetado.ultimoEvento = Date.now();

            if (ganador === datosRetador.nombre) {
              datosRetador.felicidad = Math.min(
                100,
                datosRetador.felicidad + 10
              );
              datosRetado.salud = Math.max(0, datosRetado.salud - 10);
            } else {
              datosRetado.felicidad = Math.min(100, datosRetado.felicidad + 10);
              datosRetador.salud = Math.max(0, datosRetador.salud - 10);
            }

            Promise.all([
              actualizarUsuario(datosRetador.nombre, datosRetador),
              actualizarUsuario(datosRetado.nombre, datosRetado),
            ])
              .then(() => {
                if (monedasApostadas > 0) {
                  // Las dos actualizaciones van juntas. Antes eran dos
                  // escrituras sueltas encadenadas por callback: si fallaba la
                  // segunda, el ganador ya se habia quedado con unas monedas
                  // que nadie habia perdido.
                  transaccion([
                    [
                      "UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?",
                      [monedasApostadas, ganador],
                    ],
                    [
                      "UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?",
                      [monedasApostadas, perdedor],
                    ],
                  ])
                    .then(() => {
                      narrativa.push(
                        `\n💰 ${ganador} gana ${monedasApostadas} monedas de ${perdedor}!`
                      );
                      return guardarEstadisticasDuelo(ganador, perdedor);
                    })
                    .then(() => resolve(narrativa.join("\n")))
                    .catch(reject);
                } else {
                  guardarEstadisticasDuelo(ganador, perdedor)
                    .then(() => resolve(narrativa.join("\n")))
                    .catch(reject);
                }
              })
              .catch(reject);
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

/** Suma la victoria y la derrota como una sola unidad. */
async function guardarEstadisticasDuelo(ganador, perdedor) {
  await transaccion([
    [
      "INSERT INTO duelos_stats (usuario, victorias, ultimo_duelo) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(usuario) DO UPDATE SET victorias = victorias + 1, ultimo_duelo = CURRENT_TIMESTAMP",
      [ganador],
    ],
    [
      "INSERT INTO duelos_stats (usuario, derrotas, ultimo_duelo) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(usuario) DO UPDATE SET derrotas = derrotas + 1, ultimo_duelo = CURRENT_TIMESTAMP",
      [perdedor],
    ],
  ]);
}

export const getEmoji = (size) => {
  if (size < 2) return "💀"; // Muy pequeño
  if (size < 5) return "😢"; // Pequeño
  if (size < 8) return "🤏"; // Algo pequeño
  if (size < 12) return "😌"; // Normal bajo
  if (size < 15) return "😏"; // Normal
  if (size < 18) return "😳"; // Normal alto
  if (size < 22) return "😎"; // Grande
  if (size < 25) return "🍆"; // Muy grande
  if (size < 28) return "🔥"; // Gigante
  return "🐘"; // Extremadamente grande
};
