# Twitch Commands — Endpoints HTTP para comandos de bot en Twitch

Colección de **endpoints HTTP** listos para conectarse a bots de chat de Twitch (**Nightbot**, **StreamElements**, **Botrix**, u otros). El bot llama al endpoint desde el chat con `!comando`, recibe una respuesta en texto plano y la escupe al canal. Sin instalar nada del lado del streamer.

Todas las respuestas salen como `text/plain; charset=utf-8` y en una sola línea, que es lo que los bots saben pegar en el chat.

**55 comandos, en dos grupos:** 40 [públicos](#comandos-públicos), que no tocan la base de datos y se anuncian en la portada, y 15 [con estado](#comandos-con-estado) —la economía del canal—, que existen pero sólo se documentan aquí.

---

## Persistencia

Los comandos con estado guardan monedas, inventario, rachas y estadísticas en **libSQL** (`@libsql/client`), que habla el mismo SQL que SQLite.

| Entorno | Dónde escribe | Persiste |
| --- | --- | --- |
| Local, sin configurar | `./database.db` | Sí, en tu disco |
| Producción con Turso | `libsql://…` | Sí |
| Producción sin Turso | fichero efímero | **No** |

Antes esto usaba `sqlite3` contra un fichero del disco. En Vercel el sistema de ficheros es de solo lectura salvo `/tmp`, que es propio de cada instancia y se destruye sola: con 14 comandos de economía, las monedas y las rachas desaparecían **sin dar ningún error**. Por eso la migración.

### Configurar Turso

```bash
turso db create twitchcommands
turso db show twitchcommands            # da la URL libsql://…
turso db tokens create twitchcommands   # da el token
```

Y en `.env.local` (y en las variables de entorno de tu despliegue):

```env
TURSO_DATABASE_URL=libsql://tu-base-tu-org.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
```

**La URL no es secreta; el token sí** — da acceso de escritura. Nunca lo subas al repositorio: `.gitignore` ya cubre `.env*`.

Sin esas dos variables el proyecto arranca igual contra un fichero local, así que se puede desarrollar sin cuenta de Turso. Si falta la configuración **en producción**, se avisa por consola en lugar de fallar en silencio.

Las tablas y sus migraciones se crean solas al arrancar, en Turso o en local.

## Comandos públicos

Los 40 de aquí **no tocan la base de datos**: son funciones puras que reciben texto y devuelven texto. Son los únicos que se anuncian en [la portada](https://twitchcomm.vercel.app) y los únicos que devuelve `/api/comandos`.

`/api/comandos` sin argumento lista los grupos; con uno (`/api/comandos?grupo=medidor`) lista ese grupo. La lista entera no cabe en los 480 caracteres de un mensaje de Twitch.

Los medidores (`!amor`, `!iq`, `!suerte`, `!simp`, `!cordura`, `!ship`, `!nombrerpg`, `!tarot`, `!horoscopo`) usan un **hash estable**, no `Math.random()`: el mismo nombre da siempre el mismo resultado. Con azar puro el chat repite el comando hasta que sale el número que le gusta y la broma se muere. Los que llevan "de hoy" cambian con la fecha; el resto no cambian nunca.

### 🎲 Azar y decisiones

| Comando       | Endpoint               | Qué devuelve                                        |
| ------------- | ---------------------- | --------------------------------------------------- |
| `!8ball`      | `/api/8ball`           | Bola 8 mágica: responde a lo que le preguntes.      |
| `!adivinanza` | `/api/adivinanza`      | Una adivinanza con su pista.                        |
| `!carta`      | `/api/carta`           | Saca una carta de la baraja francesa.               |
| `!dado`       | `/api/dado?tirada=`    | Tira dados: !dado, !dado d20, !dado 2d6+3.          |
| `!elige`      | `/api/elige?opciones=` | Elige por ti: !elige pizza, sushi, tacos.           |
| `!flip`       | `/api/flip`            | Cara o cruz.                                        |
| `!numero`     | `/api/numero?rango=`   | Número al azar: !numero, !numero 100, !numero 5-30. |
| `!ppt`        | `/api/ppt?jugada=`     | Piedra, papel o tijera contra el bot.               |

### 📊 Medidores

| Comando    | Endpoint                   | Qué devuelve                                           |
| ---------- | -------------------------- | ------------------------------------------------------ |
| `!amor`    | `/api/amor?usuario=&otro=` | Compatibilidad entre dos nombres. Siempre da lo mismo. |
| `!cordura` | `/api/cordura?usuario=`    | Cuánta cordura te queda hoy.                           |
| `!facha`   | `/api/facha`               | Tu porcentaje de facha.                                |
| `!iq`      | `/api/iq?usuario=`         | Tu cociente intelectual, fijo de por vida.             |
| `!memide`  | `/api/memide`              | Una medida con emoji.                                  |
| `!ship`    | `/api/ship?usuario=&otro=` | Fusiona dos nombres y les pone nota.                   |
| `!simp`    | `/api/simp?usuario=`       | Tu nivel de simp del día.                              |
| `!suerte`  | `/api/suerte?usuario=`     | Tu suerte de hoy. Mañana es otra.                      |

### 🔤 Juegos de texto

| Comando      | Endpoint                | Qué devuelve                               |
| ------------ | ----------------------- | ------------------------------------------ |
| `!aesthetic` | `/api/aesthetic?texto=` | Ｅｓｐａｃｉａ  ｅｌ  ｔｅｘｔｏ.                        |
| `!alreves`   | `/api/alreves?texto=`   | Le da la vuelta al texto, emoji incluidos. |
| `!contar`    | `/api/contar?texto=`    | Cuenta palabras y caracteres.              |
| `!morse`     | `/api/morse?texto=`     | Traduce a código morse.                    |
| `!uwu`       | `/api/uwu?texto=`       | Twaduce ew texto a uwu.                    |

### ⚔️ Rol y fantasía

| Comando      | Endpoint                  | Qué devuelve                                |
| ------------ | ------------------------- | ------------------------------------------- |
| `!animal`    | `/api/animal`             | Un animal inventado, en texto.              |
| `!clase`     | `/api/clase`              | Una clase de rol con su trasfondo.          |
| `!loot`      | `/api/loot`               | Un botín al azar. Sólo narrativo.           |
| `!mazmorra`  | `/api/mazmorra`           | Genera una sala con habitante y recompensa. |
| `!nombrerpg` | `/api/nombrerpg?usuario=` | Tu nombre de personaje, siempre el mismo.   |
| `!superhero` | `/api/superhero`          | Un superhéroe inventado.                    |
| `!tarot`     | `/api/tarot?usuario=`     | Tu carta del tarot de hoy.                  |

### 📺 Para el directo

| Comando     | Endpoint             | Qué devuelve                        |
| ----------- | -------------------- | ----------------------------------- |
| `!excusa`   | `/api/excusa`        | Una excusa para haber perdido.      |
| `!pregunta` | `/api/pregunta`      | Una pregunta para animar el chat.   |
| `!reto`     | `/api/reto`          | Un reto para la siguiente partida.  |
| `!titulo`   | `/api/titulo?juego=` | Un título clickbait para el stream. |

### 🤝 Interacción

| Comando     | Endpoint                        | Qué devuelve                 |
| ----------- | ------------------------------- | ---------------------------- |
| `!abrazo`   | `/api/abrazo?usuario=&destino=` | Abraza a otro chatter.       |
| `!cumplido` | `/api/cumplido`                 | Un cumplido al azar.         |
| `!insulto`  | `/api/insulto`                  | Un insulto en tono cómico.   |
| `!zape`     | `/api/zape?usuario=&destino=`   | Dale un zape a otro chatter. |

### 🧰 Utilidades

| Comando        | Endpoint                  | Qué devuelve                              |
| -------------- | ------------------------- | ----------------------------------------- |
| `!comandos`    | `/api/comandos`           | Esta misma lista.                         |
| `!cuentaatras` | `/api/cuentaatras?fecha=` | Días que faltan: !cuentaatras 2026-12-25. |
| `!factos`      | `/api/factos`             | Un dato curioso.                          |
| `!horoscopo`   | `/api/horoscopo?signo=`   | El horóscopo del día por signo.           |

`!dice` pasó a llamarse **`!dado`**, y acepta hasta 50 dados de hasta 1000 caras con modificador (`3d8+2`). En `d20` marca crítico y pifia.

## Comandos con estado

Leen y escriben en la base de datos. Sin los parámetros obligatorios responden **400**. El usuario se crea solo la primera vez, con 1000 monedas.

> **Éstos no se anuncian en la portada ni los devuelve `/api/comandos`: se documentan sólo aquí.**
>
> Los endpoints existen y funcionan igual; lo que se quita es el escaparate. Quien llega al sitio desde Google no encuentra `!trabajar` y no se pone a crear usuarios en una economía que es de un canal concreto.
>
> **Esto no es seguridad.** `/api/trabajar` sigue siendo una URL pública que responde a cualquiera que la escriba, y cualquiera que mire el chat del canal ve el comando en cuanto alguien lo usa. Reduce el descubrimiento casual —que es de donde sale casi todo el ruido en un canal pequeño—, no el abuso decidido. Para eso hay que exigir un secreto compartido en estos endpoints; ver [Sin autenticación](#sin-autenticación).

| Comando       | Endpoint                                        | Qué hace                                                 |
| ------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `!apostar`    | `/api/apostar?usuario=X&cantidad=N`             | Doble o nada al 50 %. Acepta `cantidad=todo`.            |
| `!diario`     | `/api/diario?usuario=X`                         | 200💰 al día + 50 por día de racha (tope 7).             |
| `!dormir`     | `/api/dormir?usuario=X`                         | Recupera 30-60 de energía y baja 10 de estrés.           |
| `!duelo`      | `/api/duelo?retador=X&retado=Y[&monedas=N]`     | Duelo por estadísticas y equipo. Cooldown de 5 min.      |
| `!inventario` | `/api/inventario?usuario=X`                     | Lo que tienes y lo que llevas puesto.                    |
| `!mercado`    | `/api/mercado?usuario=X&accion=&item=`          | `ver`, `comprar`, `vender`, `equipar`, `desequipar`.     |
| `!perfil`     | `/api/perfil?usuario=X`                         | Monedas, estadísticas y equipo.                          |
| `!ranking`    | `/api/ranking?top=N`                            | Top de monedas del canal (máx. 10).                      |
| `!regalar`    | `/api/regalar?usuario=X&destino=Y&cantidad=N`   | Transfiere monedas. Va en transacción.                   |
| `!robar`      | `/api/robar?usuario=X&victima=Y`                | 40 % de éxito; si fallas, 100💰 de multa.                |
| `!ruleta`     | `/api/ruleta?usuario=X`                         | Ruleta de premios y castigos.                            |
| `!ruletarusa` | `/api/ruletarusa?usuario=X`                     | 1 bala entre 6.                                          |
| `!stats`      | `/api/stats?usuario=X`                          | Tu récord de victorias y derrotas en duelos.             |
| `!trabajar`   | `/api/trabajar?usuario=X`                       | Trabajo aleatorio por monedas. Una vez por hora.         |

### El mercado

Cada día se sortean 5 items del catálogo, con más probabilidad cuanto más común es la rareza. Se compran, se equipan (**una pieza por categoría**: arma, armadura, amuleto, accesorio y mascota) y se venden por la mitad. Lo equipado suma ataque, defensa y suerte en los duelos.

Los nombres se buscan **sin distinguir mayúsculas ni tildes**: `!mercado comprar cinturon de fuerza` encuentra "Cinturón de Fuerza".

## Cómo integrar en tu bot

### Nightbot

```
!addcom !ruleta $(urlfetch https://twitchcomm.vercel.app/api/ruleta?usuario=$(user))
```

### StreamElements

```
!command add ruleta ${urlfetch https://twitchcomm.vercel.app/api/ruleta?usuario=${user}}
```

### Botrix

```
!custom add ruleta ${webhook:https://twitchcomm.vercel.app/api/ruleta?usuario=${sender}}
```

La portada del sitio genera el `!addcom` exacto de cada comando, ya con los parámetros correctos.

**Ojo con los comandos de varios datos.** Nightbot solo tiene una variable para el resto del mensaje, `$(querystring)`. Repartirla entre dos parámetros la duplica: `!mercado comprar Hacha` acabaría mandando `accion=comprar Hacha&item=comprar Hacha`. Por eso esos comandos aceptan todo junto en `q` y lo parten en el servidor:

```
!addcom !mercado $(urlfetch https://twitchcomm.vercel.app/api/mercado?usuario=$(user)&q=$(querystring))
!addcom !duelo   $(urlfetch https://twitchcomm.vercel.app/api/duelo?retador=$(user)&q=$(querystring))
!addcom !regalar $(urlfetch https://twitchcomm.vercel.app/api/regalar?usuario=$(user)&q=$(querystring))
```

---

## Bajo el capó

- **Framework:** Next.js 15 (Pages Router) con React 19.
- **Persistencia:** libSQL (`@libsql/client`): fichero local en desarrollo, Turso en producción.
- **UI de la landing:** TailwindCSS 4, sin librería de componentes.
- **Estructura:** cada comando es un handler en `pages/api/<comando>.js`; la lógica vive en `utils/` (`functions.js` para usuarios y duelos, `mercado.js`, `economia.js`, `dados.js`, `diversion.js` para los comandos sin estado) y las respuestas se formatean en `utils/respond.js`.

### Sin autenticación

Los endpoints con estado identifican al usuario **solo por el parámetro `usuario` de la URL**. Cualquiera que conozca la dirección puede jugar en nombre de otro, o hacer peticiones en bucle. Para un bot de chat de un canal pequeño puede bastar, pero conviene saberlo: no es un sistema de cuentas, es un contador con nombre. Si el canal crece, toca añadir un token compartido con el bot y un límite de peticiones por IP.

---

## Setup local

```bash
npm install
npm run dev            # http://localhost:3000
```

La base de datos y sus tablas se crean solas al arrancar. `database.db` no se versiona: es estado de ejecución, no código.

Variables opcionales:

| Variable | Para qué |
| --- | --- |
| `TURSO_DATABASE_URL` | Base de Turso. Sin ella se usa un fichero local. |
| `TURSO_AUTH_TOKEN` | Token de escritura de esa base. **Secreto.** |
| `DATABASE_PATH` | Ruta del fichero local. Por defecto `./database.db`. |

---

## Estructura

```
twitch_commands/
├── pages/
│   ├── index.js           # Landing, generada desde commands/index.js
│   └── api/               # Un handler por comando (55)
├── commands/index.js      # Catálogo: grupos, visibilidad y ejemplos Nightbot
├── utils/
│   ├── functions.js       # Esquema, usuarios, ruleta y duelos
│   ├── mercado.js         # Comprar, vender, equipar, inventario
│   ├── economia.js        # trabajar, diario, dormir, ranking, regalar…
│   ├── diversion.js       # Los 40 comandos sin estado
│   ├── aleatorio.js       # Hash estable, azar puro, barras y tramos
│   ├── listas.js          # Textos de los comandos sin estado
│   ├── dados.js           # Notación de tiradas (2d6+3)
│   ├── respond.js         # Formato de respuesta para bots de chat
│   └── const.js           # Textos, premios y catálogo de items
└── components/            # UI de la landing
```

---

Hecho con ❤️ por **Sack**.
