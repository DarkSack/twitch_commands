const { premios, eventos, catalogo } = require("./const");

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos SQLite");
  }
});
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

// Crear tabla de usuarios si no existe
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
    )
  `);

// Crear tabla de inventario
db.run(`
    CREATE TABLE IF NOT EXISTS inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        item TEXT,
        cantidad INTEGER DEFAULT 1,
        FOREIGN KEY(usuario) REFERENCES usuarios(nombre)
    )
  `);

db.serialize(() => {
  // Tabla de estadísticas de duelos
  db.run(`CREATE TABLE IF NOT EXISTS duelos_stats (
            usuario TEXT PRIMARY KEY,
            victorias INTEGER DEFAULT 0,
            derrotas INTEGER DEFAULT 0,
            monedas_ganadas INTEGER DEFAULT 0,
            ultimo_duelo TIMESTAMP
        )`);

  // Tabla de historial de duelos
  db.run(`CREATE TABLE IF NOT EXISTS duelos_historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            retador TEXT,
            retado TEXT,
            ganador TEXT,
            tipo_victoria TEXT,
            monedas_apostadas INTEGER,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);
});

//Funciones 🛠️
export function obtenerUsuario(nombre) {
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
                ) VALUES (?, 1000, 50, 50, 50, 50, 100, 0, 18, 'Desempleado', 0, ?)
              `,
            [nombre, Date.now()],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              // Obtener el usuario recién creado
              db.get(
                "SELECT diasVividos, ultimoEvento, dinero, felicidad, salud, social, inteligencia, energia, estres, edad, profesion FROM usuarios WHERE nombre = ?",
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
export function actualizarUsuario(nombre, datos) {
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
        if (err) reject(err);
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

export async function getMonedas(usuario) {
  return new Promise((resolve) => {
    db.get(
      "SELECT dinero FROM usuarios WHERE nombre = ?",
      [usuario],
      (err, row) => {
        resolve(formatearDinero(row?.dinero || 0));
      }
    );
  });
}

export async function getEquipo(usuario) {
  return new Promise((resolve) => {
    db.all(
      "SELECT item FROM inventario WHERE usuario = ? AND item LIKE '%(Equipado)'",
      [usuario],
      (err, rows) => {
        resolve(rows.map((row) => row.item.replace(" (Equipado)", "")));
      }
    );
  });
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

export async function girarRuleta(usuario) {
  return new Promise((resolve, reject) => {
    // Seleccionar un premio aleatorio
    const premio = premios[Math.floor(Math.random() * premios.length)];

    db.get("SELECT * FROM usuarios WHERE nombre = ?", [usuario], (err, row) => {
      if (err) {
        console.error(err);
        reject(new Error("Error interno del servidor."));
        return;
      }
      if (!row) {
        resolve("❌ Usuario no encontrado.");
        return;
      }

      // Calcular los nuevos valores
      const nuevosValores = {
        dinero: (row.dinero || 0) + (premio.dinero || 0),
        felicidad: Math.max(0, (row.felicidad || 0) + (premio.felicidad || 0)),
        salud: Math.max(0, (row.salud || 0) + (premio.salud || 0)),
        social: Math.max(0, (row.social || 0) + (premio.social || 0)),
        inteligencia: Math.max(
          0,
          (row.inteligencia || 0) + (premio.inteligencia || 0)
        ),
        energia: Math.max(0, (row.energia || 0) + (premio.energia || 0)),
        estres: Math.max(0, (row.estres || 0) + (premio.estres || 0)),
        edad: (row.edad || 0) + (premio.edad || 0),
      };

      // Actualizar los datos en la base de datos
      db.run(
        `UPDATE usuarios SET 
            dinero = ?, felicidad = ?, salud = ?, social = ?, 
            inteligencia = ?, energia = ?, estres = ?, edad = ?
            WHERE nombre = ?`,
        [
          nuevosValores.dinero,
          nuevosValores.felicidad,
          nuevosValores.salud,
          nuevosValores.social,
          nuevosValores.inteligencia,
          nuevosValores.energia,
          nuevosValores.estres,
          nuevosValores.edad,
          usuario,
        ],
        (err) => {
          if (err) {
            console.error(err);
            reject(new Error("Error al actualizar los datos."));
            return;
          }

          // Construir respuesta con valores modificados
          let respuesta = premio.mensaje;
          const cambios = Object.entries(nuevosValores)
            .map(([stat, valor]) => `${stat}: ${valor}`)
            .join(" | ");

          resolve(`${respuesta}\n📊 Estado actual: ${cambios}`);
        }
      );
    });
  });
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
            const cooldown = 5 * 60 * 100;
            if (Date.now() - datosRetador.ultimoEvento < cooldown) {
              const tiempoRestante = Math.ceil(
                (cooldown - (Date.now() - datosRetador.ultimoEvento)) / 60000
              );
              resolve(
                `❌ ${retador}, espera ${tiempoRestante} minutos para otro duelo.`
              );
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

            const ganador =
              poderRetador > poderRetado
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
                poderRetador > poderRetado
                  ? "poder abrumador"
                  : "estrategia superior"
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
                      if (err) reject(err);
                      db.run(
                        "UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?",
                        [monedasApostadas, perdedor],
                        (err) => {
                          if (err) reject(err);
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
        if (err) reject(err);
        db.run(
          "INSERT INTO duelos_stats (usuario, derrotas, ultimo_duelo) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(usuario) DO UPDATE SET derrotas = derrotas + 1, ultimo_duelo = CURRENT_TIMESTAMP",
          [perdedor],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      }
    );
  });
}

async function gestionarMercado(usuario, accion, item) {
  return new Promise((resolve, reject) => {
    if (!usuario) {
      resolve("❌ Debes especificar un usuario con ?usuario=tu_nombre.");
      return;
    }

    const hoy = new Date().toISOString().split("T")[0];

    if (!cachedOferta || cachedFecha !== hoy) {
      const items = Object.values(catalogo).flatMap(Object.entries);
      const probabilidades = {
        Común: 0.5,
        Raro: 0.3,
        Épico: 0.15,
        Legendario: 0.05,
      };

      let seleccionados = [];
      while (seleccionados.length < 5) {
        const idx = Math.floor(Math.random() * items.length);
        const [nombre, datos] = items[idx];

        if (
          Math.random() < probabilidades[datos.rareza] &&
          !seleccionados.some((i) => i.nombre === nombre)
        ) {
          seleccionados.push({ nombre, ...datos });
        }
      }

      cachedOferta = seleccionados;
      cachedFecha = hoy;
    }

    getMonedas(usuario)
      .then((monedasUsuario) => {
        if (!accion || accion === "ver") {
          const lista = cachedOferta
            .map(
              (i) =>
                `✦${i.nombre} (${i.rareza}) - ${i.precio} monedas | Atk: ${i.ataque}, Def: ${i.defensa}, Luck: ${i.suerte}✦`
            )
            .join("\n");
          resolve(
            `🏬 MERCADO ÉPICO - ${hoy} 🏬\n\n${lista}\n\n💰 Tienes ${monedasUsuario} monedas.`
          );
        } else if (accion === "comprar") {
          const datosItem = cachedOferta.find((i) => i.nombre === item);
          if (!datosItem) {
            resolve("❌ Item no disponible hoy. Usa !mercado.");
            return;
          }
          if (monedasUsuario < datosItem.precio) {
            resolve(
              `❌ No tienes suficientes monedas (${monedasUsuario}/${datosItem.precio}).`
            );
            return;
          }

          db.run(
            "UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?",
            [datosItem.precio, usuario],
            (err) => {
              if (err) reject(err);
              db.run(
                "INSERT INTO inventario (usuario, item, cantidad) VALUES (?, ?, 1) ON CONFLICT(usuario, item) DO UPDATE SET cantidad = cantidad + 1",
                [usuario, item],
                (err) => {
                  if (err) reject(err);
                  if (datosItem.evolucion) {
                    db.run(
                      "INSERT OR IGNORE INTO mascotas (usuario, nombre, nivel, hambre) VALUES (?, ?, 1, 100)",
                      [usuario, item],
                      (err) => {
                        if (err) reject(err);
                        resolve(
                          `✅ ${usuario} compró ${item} por ${datosItem.precio} monedas. ¡Tu mascota está lista!`
                        );
                      }
                    );
                  } else {
                    resolve(
                      `✅ ${usuario} compró ${item} por ${datosItem.precio} monedas.`
                    );
                  }
                }
              );
            }
          );
        } else if (accion === "vender") {
          if (!item) {
            resolve("❌ Especifica un item.");
            return;
          }
          db.get(
            "SELECT cantidad FROM inventario WHERE usuario = ? AND item = ?",
            [usuario, item],
            (err, row) => {
              if (err) reject(err);
              const cantidad = row?.cantidad || 0;
              if (cantidad < 1) {
                resolve(`❌ No tienes ${item} en tu inventario.`);
                return;
              }

              const datosItem = Object.values(catalogo)
                .flatMap((cat) => Object.entries(cat))
                .find(([n]) => n === item)?.[1];
              const precioVenta = datosItem?.precio * 0.5 || 50;
              db.run(
                "UPDATE usuarios SET dinero = dinero + ? WHERE nombre = ?",
                [precioVenta, usuario],
                (err) => {
                  if (err) reject(err);
                  db.run(
                    "UPDATE inventario SET cantidad = cantidad - 1 WHERE usuario = ? AND item = ?",
                    [usuario, item],
                    (err) => {
                      if (err) reject(err);
                      db.run(
                        "DELETE FROM inventario WHERE usuario = ? AND item = ? AND cantidad <= 0",
                        [usuario, item],
                        (err) => {
                          if (err) reject(err);
                          if (datosItem?.evolucion) {
                            db.run(
                              "DELETE FROM mascotas WHERE usuario = ? AND nombre = ?",
                              [usuario, item],
                              (err) => {
                                if (err) reject(err);
                                resolve(
                                  `💸 ${usuario} vendió ${item} por ${precioVenta} monedas.`
                                );
                              }
                            );
                          } else {
                            resolve(
                              `💸 ${usuario} vendió ${item} por ${precioVenta} monedas.`
                            );
                          }
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        } else if (accion === "equipar") {
          if (!item) {
            resolve("❌ Especifica un item.");
            return;
          }
          db.get(
            "SELECT cantidad FROM inventario WHERE usuario = ? AND item = ?",
            [usuario, item],
            (err, row) => {
              if (err) reject(err);
              if (!(row?.cantidad > 0)) {
                resolve(`❌ No tienes ${item} en tu inventario.`);
                return;
              }

              const datosItem = Object.values(catalogo)
                .flatMap((cat) => Object.entries(cat))
                .find(([n]) => n === item)?.[1];
              if (
                !datosItem ||
                ![
                  "armas",
                  "armaduras",
                  "amuletos",
                  "accesorios",
                  "mascotas",
                ].some((cat) => catalogo[cat][item])
              ) {
                resolve("❌ Este item no se puede equipar.");
                return;
              }
              const tipo = Object.keys(catalogo)
                .find((cat) => catalogo[cat][item])
                ?.replace("s", "");

              db.all(
                "SELECT item FROM inventario WHERE usuario = ? AND item LIKE '%(Equipado)'",
                [usuario],
                (err, rows) => {
                  if (err) reject(err);
                  rows.forEach((row) => {
                    const nombreBase = row.item.replace(" (Equipado)", "");
                    if (
                      Object.keys(catalogo).find(
                        (cat) => catalogo[cat][nombreBase]?.tipo === tipo
                      )
                    ) {
                      db.run(
                        "UPDATE inventario SET item = ? WHERE usuario = ? AND item = ?",
                        [nombreBase, usuario, row.item],
                        (err) => {
                          if (err) reject(err);
                        }
                      );
                    }
                  });
                  db.run(
                    "UPDATE inventario SET item = ? WHERE usuario = ? AND item = ?",
                    [`${item} (Equipado)`, usuario, item],
                    (err) => {
                      if (err) reject(err);
                      resolve(
                        `⚔️ ${usuario} equipó ${item}. ¡Listo para la batalla!`
                      );
                    }
                  );
                }
              );
            }
          );
        } else if (accion === "alimentar") {
          if (!item) {
            resolve("❌ Especifica una mascota.");
            return;
          }
          db.get(
            "SELECT nivel, hambre, ultima_alimentacion FROM mascotas WHERE usuario = ? AND nombre = ?",
            [usuario, item],
            (err, row) => {
              if (err) reject(err);
              if (!row) {
                resolve(`❌ No tienes la mascota ${item}.`);
                return;
              }
              const datosMascota = row;
              const tiempoDesdeAlimentacion =
                Date.now() -
                new Date(datosMascota.ultima_alimentacion).getTime();
              if (tiempoDesdeAlimentacion < 86400000) {
                resolve(`❌ Solo puedes alimentar a ${item} una vez al día.`);
                return;
              }

              const costoAlimentacion = datosMascota.nivel * 50;
              if (monedasUsuario < costoAlimentacion) {
                resolve(
                  `❌ Necesitas ${costoAlimentacion} monedas para alimentar a ${item}.`
                );
                return;
              }

              const nuevaHambre = Math.min(100, datosMascota.hambre + 50);
              let nivelUp = datosMascota.nivel;
              let evolucion = "";
              if (nuevaHambre >= 100 && datosMascota.nivel < 3) {
                nivelUp++;
                if (catalogo.mascotas[item]?.evolucion) {
                  evolucion = catalogo.mascotas[item].evolucion;
                  db.run(
                    "UPDATE inventario SET item = ? WHERE usuario = ? AND item = ?",
                    [`${evolucion} (Equipado)`, usuario, `${item} (Equipado)`],
                    (err) => {
                      if (err) reject(err);
                    }
                  );
                  db.run(
                    "UPDATE mascotas SET nombre = ? WHERE usuario = ? AND nombre = ?",
                    [evolucion, usuario, item],
                    (err) => {
                      if (err) reject(err);
                    }
                  );
                }
              }

              db.run(
                "UPDATE usuarios SET dinero = dinero - ? WHERE nombre = ?",
                [costoAlimentacion, usuario],
                (err) => {
                  if (err) reject(err);
                  db.run(
                    "UPDATE mascotas SET nivel = ?, hambre = ?, ultima_alimentacion = CURRENT_TIMESTAMP WHERE usuario = ? AND nombre = ?",
                    [nivelUp, nuevaHambre, usuario, item],
                    (err) => {
                      if (err) reject(err);
                      resolve(
                        `🍖 ${usuario} alimentó a ${item} por ${costoAlimentacion} monedas. Hambre: ${nuevaHambre}%${
                          evolucion
                            ? `\n🌟 ¡${item} evolucionó a ${evolucion}!`
                            : ""
                        }`
                      );
                    }
                  );
                }
              );
            }
          );
        } else {
          resolve(
            "❌ Acción no válida. Usa ?accion=ver/comprar/vender/equipar/alimentar"
          );
        }
      })
      .catch((err) => reject(err));
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
