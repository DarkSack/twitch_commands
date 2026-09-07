const { premios, eventos, catalogo } = require("./const");

const path = require("node:path");

const sqlite3 = require("sqlite3").verbose();

/**
 * Ruta del fichero SQLite.
 *
 * Estaba fija en "./database.db", relativa al directorio de trabajo del
 * proceso. En un despliegue serverless (Vercel) el sistema de ficheros es de
 * SOLO LECTURA salvo /tmp, asi que ahi cualquier escritura falla: las monedas,
 * el inventario y los duelos no se guardaban y el endpoint devolvia 500.
 *
 * AVISO IMPORTANTE: apuntar a /tmp evita el error, pero NO da persistencia.
 * Cada instancia serverless tiene su propio /tmp y se destruye sola, asi que
 * el progreso se pierde. Para que el juego funcione de verdad en produccion
 * hace falta una base de datos externa (Turso, Postgres, Redis). Esto es una
 * tirita, no la cura; queda explicado en el README.
 */
const DB_PATH =
  process.env.DATABASE_PATH ||
  (process.env.VERCEL ? path.join("/tmp", "database.db") : "./database.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error(`Error al conectar a la base de datos (${DB_PATH}):`, err);
  } else {
    console.log(`Conectado a SQLite en ${DB_PATH}`);
  }
});
/* ── SQLite con promesas ───────────────────────────────────────────
   El codigo original encadenaba callbacks a cuatro y cinco niveles, que es
   de donde salieron la mitad de los fallos (rechazos sin return, errores
   ignorados). Todo lo nuevo va contra estos tres envoltorios. */

export async function run(sql, params = []) {
  await esquemaListo;
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

export async function get(sql, params = []) {
  await esquemaListo;
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

export async function all(sql, params = []) {
  await esquemaListo;
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

let cachedOferta;
let cachedFecha;
export function formatearDinero(cantidad) {
  if (cantidad >= 1_000_000_000) {
    return (cantidad / 1_000_000_000).toFixed(2) + "B"; // Billones
  } else if (cantidad >= 1_000_000) {
    return (cantidad / 1_000_000).toFixed(2) + "M"; // Millones
  } else if (cantidad >= 1_000) {
    return (cantidad / 1_000).toFixed(1) + "K"; // Miles
  }
  return cantidad.toString(); // Si es menor a 1000, no cambia
}

/* ── Esquema ───────────────────────────────────────────────────────
   TODO va dentro de un unico `db.serialize()` y detras de la promesa
   `esquemaListo`.

   Antes eran `db.run(...)` sueltos al cargar el modulo. El driver de sqlite3
   NO serializa por defecto, asi que el `ALTER TABLE inventario` se ejecutaba
   antes que su `CREATE TABLE` y moria con "no such table: inventario"; el
   indice unico y la migracion de `equipado` se perdian con el. Ademas la
   primera peticion podia llegar antes de que existiera ninguna tabla.

   Los helpers `run`/`get`/`all` esperan a `esquemaListo`, asi que a partir de
   aqui nada consulta una tabla que todavia no existe. */

export const esquemaListo = new Promise((resolve, reject) => {
  db.serialize(() => {
    db.run(`
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

    db.run(`
      CREATE TABLE IF NOT EXISTS inventario (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuario TEXT,
          item TEXT,
          cantidad INTEGER DEFAULT 1,
          FOREIGN KEY(usuario) REFERENCES usuarios(nombre)
      )`);

    // Estar equipado se guardaba renombrando la fila a "Espada (Equipado)".
    // Eso rompia el ON CONFLICT (para SQLite son dos items distintos),
    // duplicaba filas al comprar una segunda copia, y se corrompia con
    // cualquier item cuyo nombre llevara ese sufijo. Ahora es una columna.
    db.run("ALTER TABLE inventario ADD COLUMN equipado INTEGER DEFAULT 0", (err) => {
      // "duplicate column" solo significa que ya se migro antes.
      if (err && !/duplicate column/i.test(err.message)) {
        console.error("Migracion inventario.equipado:", err.message);
      }
    });
    db.run(
      "UPDATE inventario SET equipado = 1, item = REPLACE(item, ' (Equipado)', '') WHERE item LIKE '%(Equipado)'"
    );

    // Sin este indice, el ON CONFLICT(usuario, item) del mercado fallaba con
    // "does not match any PRIMARY KEY or UNIQUE constraint". Se limpian antes
    // los duplicados que pudieran existir, o la creacion del indice falla.
    db.run(`
      DELETE FROM inventario WHERE id NOT IN (
        SELECT MIN(id) FROM inventario GROUP BY usuario, item
      )`);
    db.run(`
      CREATE UNIQUE INDEX IF NOT EXISTS inventario_usuario_item
          ON inventario (usuario, item)`);

    // El mercado inserta y borra en `mascotas`, y la tabla no se creaba en
    // ningun sitio: comprar un item con evolucion daba "no such table".
    db.run(`
      CREATE TABLE IF NOT EXISTS mascotas (
          usuario TEXT NOT NULL,
          nombre  TEXT NOT NULL,
          nivel   INTEGER DEFAULT 1,
          hambre  INTEGER DEFAULT 100,
          PRIMARY KEY (usuario, nombre)
      )`);

    db.run(`
      CREATE TABLE IF NOT EXISTS duelos_stats (
          usuario TEXT PRIMARY KEY,
          victorias INTEGER DEFAULT 0,
          derrotas INTEGER DEFAULT 0,
          monedas_ganadas INTEGER DEFAULT 0,
          ultimo_duelo TIMESTAMP
      )`);

    db.run(`
      CREATE TABLE IF NOT EXISTS duelos_historial (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          retador TEXT,
          retado TEXT,
          ganador TEXT,
          tipo_victoria TEXT,
          monedas_apostadas INTEGER,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

    // Columnas de los comandos de economia. Van aqui, en el mismo bloque
    // serializado, para que no vuelvan a correr contra tablas inexistentes.
    for (const [columna, tipo] of [
      ["ultimoTrabajo", "INTEGER DEFAULT 0"],
      ["ultimaRecompensa", "INTEGER DEFAULT 0"],
      ["racha", "INTEGER DEFAULT 0"],
    ]) {
      db.run(`ALTER TABLE usuarios ADD COLUMN ${columna} ${tipo}`, (err) => {
        if (err && !/duplicate column/i.test(err.message)) {
          console.error(`Migracion usuarios.${columna}:`, err.message);
        }
      });
    }

    // Marca el final de la cola: al ejecutarse, todo lo anterior ya corrio.
    db.run("SELECT 1", (err) => (err ? reject(err) : resolve()));
  });
});

//Funciones 🛠️
export async function obtenerUsuario(nombre) {
  await esquemaListo;
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT nombre, diasVividos, ultimoEvento, dinero, felicidad, salud, social, inteligencia, energia, estres, edad, profesion FROM usuarios WHERE nombre = ?",
      [nombre],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          resolve(row); // Retorna el usuario existente
        } else {
          // Crear nuevo usuario si no existe
          db.run(
            `
                INSERT INTO usuarios (
                  nombre, dinero, felicidad, salud, social, inteligencia, energia, estres, edad, profesion, diasVividos, ultimoEvento
                ) VALUES (?, 1000, 50, 50, 50, 50, 100, 0, 18, 'Desempleado', 0, 0)
              `,
            // `ultimoEvento` arranca en 0, no en Date.now(). Con la hora
            // actual, el usuario recien creado ya estaba en cooldown y su
            // primer !duelo respondia "espera N minutos": nadie podia
            // estrenar el comando.
            [nombre],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              // Obtener el usuario recién creado
              db.get(
                // `nombre` faltaba en este SELECT y si estaba en el de
                // arriba. Resultado: un usuario recien creado volvia sin
                // nombre, y el duelo narraba "undefined VS undefined". No se
                // veia porque el cooldown mal calculado impedia que nadie
                // llegase hasta aqui en su primer duelo.
                "SELECT nombre, diasVividos, ultimoEvento, dinero, felicidad, salud, social, inteligencia, energia, estres, edad, profesion FROM usuarios WHERE nombre = ?",
                [nombre],
                (err, row) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(row);
                  }
                }
              );
            }
          );
        }
      }
    );
  });
}

// Función para actualizar usuario
export async function actualizarUsuario(nombre, datos) {
  await esquemaListo;
  return new Promise((resolve, reject) => {
    const query = `
            UPDATE usuarios SET
                dinero = ?,
                felicidad = ?,
                salud = ?,
                social = ?,
                inteligencia = ?,
                energia = ?,
                estres = ?,
                edad = ?,
                profesion = ?,
                diasVividos = ?,
                ultimoEvento = ?
            WHERE nombre = ?
        `;

    db.run(
      query,
      [
        datos.dinero,
        datos.felicidad,
        datos.salud,
        datos.social,
        datos.inteligencia,
        datos.energia,
        datos.estres,
        datos.edad,
        datos.profesion,
        datos.diasVividos,
        datos.ultimoEvento,
        nombre,
      ],
      (err) => {
        if (err) return reject(err);
        else resolve();
      }
    );
  });
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
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT dinero FROM usuarios WHERE nombre = ?",
      [usuario],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(Number(row?.dinero) || 0);
      }
    );
  });
}

export async function getEquipo(usuario) {
  const filas = await all(
    "SELECT item FROM inventario WHERE usuario = ? AND equipado = 1 AND cantidad > 0",
    [usuario]
  );
  return filas.map((f) => f.item);
}

// Función separada para manejar la lógica de apostar
export async function procesarApuesta(usuario, cantidad) {
  return new Promise((resolve, reject) => {
    if (isNaN(cantidad) || cantidad <= 0) {
      resolve("❌ Debes apostar una cantidad válida de monedas.");
      return;
    }

    db.get(
      "SELECT dinero FROM usuarios WHERE nombre = ?",
      [usuario],
      (err, row) => {
        if (err) {
          console.error(err);
          reject(new Error("Error interno del servidor"));
          return;
        }

        if (!row || row.dinero < cantidad) {
          resolve(
            `❌ ${usuario}, no tienes suficientes monedas para apostar. Tienes ${
              row?.dinero || 0
            } monedas.`
          );
          return;
        }

        // Resultado de la apuesta (50% de ganar)
        const gano = Math.random() < 0.5;
        const nuevoSaldo = gano ? row.dinero + cantidad : row.dinero - cantidad;

        db.run(
          "UPDATE usuarios SET dinero = ? WHERE nombre = ?",
          [nuevoSaldo, usuario],
          (err) => {
            if (err) {
              console.error(err);
              reject(new Error("Error interno del servidor"));
              return;
            }

            resolve(
              gano
                ? `🎉 ¡Felicidades ${usuario}! Ganaste ${cantidad} monedas. Ahora tienes ${nuevoSaldo} monedas.`
                : `😢 Lo siento ${usuario}, perdiste ${cantidad} monedas. Ahora tienes ${nuevoSaldo} monedas.`
            );
          }
        );
      }
    );
  });
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
function guardarStats(usuario, v) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE usuarios SET
          dinero = ?, felicidad = ?, salud = ?, social = ?,
          inteligencia = ?, energia = ?, estres = ?, edad = ?
          WHERE nombre = ?`,
      [
        v.dinero, v.felicidad, v.salud, v.social,
        v.inteligencia, v.energia, v.estres, v.edad, usuario,
      ],
      (err) => (err ? reject(err) : resolve())
    );
  });
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
                  db.run(
                    "UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?",
                    [monedasApostadas, ganador],
                    (err) => {
                      if (err) return reject(err);
                      db.run(
                        "UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?",
                        [monedasApostadas, perdedor],
                        (err) => {
                          if (err) return reject(err);
                          narrativa.push(
                            `\n💰 ${ganador} gana ${monedasApostadas} monedas de ${perdedor}!`
                          );
                          guardarEstadisticasDuelo(ganador, perdedor)
                            .then(() => resolve(narrativa.join("\n")))
                            .catch(reject);
                        }
                      );
                    }
                  );
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

// Función auxiliar para guardar estadísticas del duelo
function guardarEstadisticasDuelo(ganador, perdedor) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO duelos_stats (usuario, victorias, ultimo_duelo) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(usuario) DO UPDATE SET victorias = victorias + 1, ultimo_duelo = CURRENT_TIMESTAMP",
      [ganador],
      (err) => {
        if (err) return reject(err);
        db.run(
          "INSERT INTO duelos_stats (usuario, derrotas, ultimo_duelo) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(usuario) DO UPDATE SET derrotas = derrotas + 1, ultimo_duelo = CURRENT_TIMESTAMP",
          [perdedor],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      }
    );
  });
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
