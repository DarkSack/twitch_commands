# Twitch Commands — Endpoints HTTP para comandos de bot en Twitch

Colección de **endpoints HTTP** listos para conectarse a bots de chat de Twitch (**Nightbot**, **StreamElements**, **Botrix**, u otros). El bot llama al endpoint desde el chat con `!comando`, recibe una respuesta en texto plano y la escupe al canal. Sin instalar nada del lado del streamer.

Todas las respuestas salen como `text/plain; charset=utf-8` y en una sola línea, que es lo que los bots saben pegar en el chat.

---

## ⚠️ Antes de desplegar: la persistencia no funciona en serverless

Los comandos con estado (`!ruleta`, `!duelo`, `!mercado`, `!trabajar`…) guardan monedas y estadísticas en **SQLite sobre disco**. En Vercel —y en cualquier plataforma serverless— el sistema de ficheros es de solo lectura salvo `/tmp`, y **cada instancia tiene su propio `/tmp`, que se destruye sola**.

Consecuencia práctica: en producción el progreso de los usuarios se pierde sin aviso. Los comandos responden, pero las monedas no sobreviven.

Para que la economía funcione de verdad hace falta mover la persistencia a una base de datos externa (Turso/libSQL, Postgres, Redis). Mientras tanto:

- En local funciona bien: `./database.db`.
- La ruta se puede fijar con la variable `DATABASE_PATH`.
- Los comandos **sin estado** (los 13 de la primera tabla) funcionan perfectamente en serverless.

---

## Comandos sin estado

Funcionan en cualquier sitio, no tocan la base de datos.

| Comando       | Endpoint              | Qué devuelve                                          |
| ------------- | --------------------- | ----------------------------------------------------- |
| `!8ball`      | `/api/8ball`          | Una respuesta de bola 8 mágica.                       |
| `!adivinanza` | `/api/adivinanza`     | Una adivinanza con su pista.                          |
| `!animal`     | `/api/animal`         | Un animal inventado, en texto. No hay imagen.         |
| `!catalogo`   | `/api/catalogo?categoria=` | Los items que existen, por categoría.            |
| `!comandos`   | `/api/comandos`       | La lista de comandos.                                 |
| `!cumplido`   | `/api/cumplido`       | Un cumplido al azar.                                  |
| `!dado`       | `/api/dado?tirada=`   | Tira dados: `!dado`, `!dado d20`, `!dado 2d6+3`.      |
| `!facha`      | `/api/facha`          | Un porcentaje de "facha". Texto, no imagen.           |
| `!factos`     | `/api/factos`         | Un dato curioso.                                       |
| `!flip`       | `/api/flip`           | Cara o cruz.                                           |
| `!insulto`    | `/api/insulto`        | Un "insulto" en tono cómico.                          |
| `!memide`     | `/api/memide`         | Una medida en cm con emoji. Texto, no imagen.         |
| `!superhero`  | `/api/superhero`      | Un superhéroe inventado.                              |

`!dice` pasó a llamarse **`!dado`**, y ahora sí acepta la notación que el README prometía desde el principio: hasta 50 dados de hasta 1000 caras, con modificador (`3d8+2`). En `d20` marca crítico y pifia.

## Comandos con estado

Leen y escriben en la base de datos. Sin los parámetros obligatorios responden **400**. El usuario se crea solo la primera vez, con 1000 monedas.

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
- **Persistencia:** SQLite (`sqlite3`). Ver el aviso de arriba.
- **UI de la landing:** TailwindCSS 4 + Radix UI.
- **Estructura:** cada comando es un handler en `pages/api/<comando>.js`; la lógica vive en `utils/` (`functions.js` para usuarios y duelos, `mercado.js`, `economia.js`, `dados.js`) y las respuestas se formatean en `utils/respond.js`.

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

| Variable        | Para qué                                                       |
| --------------- | -------------------------------------------------------------- |
| `DATABASE_PATH` | Ruta del fichero SQLite. Por defecto `./database.db`, o `/tmp/database.db` en Vercel. |

---

## Estructura

```
twitch_commands/
├── pages/
│   ├── index.js           # Landing, generada desde commands/index.js
│   └── api/               # Un handler por comando (27)
├── commands/index.js      # Catálogo: fuente única de la lista de comandos
├── utils/
│   ├── functions.js       # Esquema, usuarios, ruleta y duelos
│   ├── mercado.js         # Comprar, vender, equipar, inventario
│   ├── economia.js        # trabajar, diario, dormir, ranking, regalar…
│   ├── dados.js           # Notación de tiradas (2d6+3)
│   ├── respond.js         # Formato de respuesta para bots de chat
│   └── const.js           # Textos, premios y catálogo de items
└── components/            # UI de la landing
```

---

Hecho con ❤️ por **Sack**.
