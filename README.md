# Twitch Commands — Endpoints HTTP para comandos de bot en Twitch

Colección de **endpoints HTTP** listos para conectarse a bots de chat de Twitch (**Nightbot**, **StreamElements**, **Botrix**, u otros). El bot llama al endpoint desde el chat con `!comando`, recibe una respuesta en texto plano y la escupe al canal. Sin instalar nada del lado del streamer.

Todas las respuestas salen como `text/plain; charset=utf-8` y en una sola línea, que es lo que los bots saben pegar en el chat.

---

## ⚠️ Antes de desplegar: la persistencia no funciona en serverless

Los comandos con estado (`!ruleta`, `!ruletarusa`, `!duelo`) guardan monedas y estadísticas en **SQLite sobre disco**. En Vercel —y en cualquier plataforma serverless— el sistema de ficheros es de solo lectura salvo `/tmp`, y **cada instancia tiene su propio `/tmp`, que se destruye sola**.

Consecuencia práctica: en producción el progreso de los usuarios se pierde sin aviso. Los comandos responden, pero las monedas no sobreviven.

Para que la economía funcione de verdad hace falta mover la persistencia a una base de datos externa (Turso/libSQL, Postgres, Redis). Mientras tanto:

- En local funciona bien: `./database.db`.
- La ruta se puede fijar con la variable `DATABASE_PATH`.
- Los comandos **sin estado** (los 11 de la primera tabla) funcionan perfectamente en serverless.

---

## Comandos sin estado

Funcionan en cualquier sitio, no tocan la base de datos.

| Comando       | Endpoint             | Qué devuelve                                        |
| ------------- | -------------------- | --------------------------------------------------- |
| `!8ball`      | `GET /api/8ball`     | Una respuesta de bola 8 mágica.                     |
| `!adivinanza` | `GET /api/adivinanza`| Una adivinanza con su pista (la solución no se manda). |
| `!animal`     | `GET /api/animal`    | Un animal inventado, en texto. No hay imagen.       |
| `!cumplido`   | `GET /api/cumplido`  | Un cumplido al azar.                                |
| `!dice`       | `GET /api/dice`      | Un número del 1 al 6. No admite formato `d20`/`2d6`. |
| `!facha`      | `GET /api/facha`     | Un porcentaje de "facha". Es texto, no una imagen.  |
| `!factos`     | `GET /api/factos`    | Un dato curioso.                                     |
| `!flip`       | `GET /api/flip`      | Cara o cruz.                                         |
| `!insulto`    | `GET /api/insulto`   | Un "insulto" en tono cómico.                        |
| `!memide`     | `GET /api/memide`    | Una medida en cm con emoji. Es texto, no una imagen. |
| `!superhero`  | `GET /api/superhero` | Un superhéroe inventado con su poder.               |

## Comandos con estado

Leen y escriben en la base de datos. Requieren parámetros; sin ellos responden **400**.

| Comando       | Endpoint                                              | Qué hace                                              |
| ------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `!ruleta`     | `GET /api/ruleta?usuario=X`                           | Gira una ruleta de premios y castigos; aplica el resultado. |
| `!ruletarusa` | `GET /api/ruletarusa?usuario=X`                       | 1 bala entre 6. Aplica premio o castigo en monedas.   |
| `!duelo`      | `GET /api/duelo?retador=X&retado=Y[&monedas=N]`       | Duelo por estadísticas y equipo. Cooldown de 5 min por retador. |

El usuario se crea solo la primera vez que aparece, con 1000 monedas.

---

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

Cambia `ruleta` por cualquier otro comando — todos siguen el mismo patrón. Para `!duelo` hacen falta dos usuarios: `?retador=$(user)&retado=$(querystring)`.

---

## Bajo el capó

- **Framework:** Next.js 15 (Pages Router) con React 19.
- **Persistencia:** SQLite (`sqlite3`). Ver el aviso de arriba.
- **UI de la landing:** TailwindCSS 4 + Radix UI.
- **Estructura:** cada comando es un handler en `pages/api/<comando>.js`; la lógica de juego vive en `utils/functions.js` y las respuestas se formatean en `utils/respond.js`.

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
│   ├── index.js           # Landing
│   └── api/               # Un handler por comando
├── commands/index.js      # Catálogo de comandos (hoy no lo importa nadie)
├── utils/
│   ├── functions.js       # Lógica de juego y acceso a SQLite
│   ├── respond.js         # Formato de respuesta para bots de chat
│   └── const.js           # Textos, premios y catálogo de items
└── components/            # UI de la landing
```

---

Hecho con ❤️ por **Sack**.
