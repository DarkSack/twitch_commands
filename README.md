# Twitch Commands — Endpoints HTTP para comandos de bot en Twitch

Colección de **endpoints HTTP** listos para conectarse a bots de chat de Twitch (**Nightbot**, **StreamElements**, **Botrix**, u otros). El bot llama al endpoint desde el chat con `!comando`, recibe una respuesta en texto plano y la escupe al canal. Sin instalar nada del lado del streamer.

---

## Comandos disponibles

| Comando         | Endpoint                    | Qué hace                                                                     |
| --------------- | --------------------------- | ---------------------------------------------------------------------------- |
| `!ruleta`       | `GET /api/ruleta?usuario=X` | Gira una ruleta con premios o castigos para el usuario.                      |
| `!ruletarusa`   | `GET /api/ruletarusa`       | Juego de ruleta rusa; el jugador puede ganar o perder monedas.               |
| `!duelo`        | `GET /api/duelo`            | Desafía al streamer o a otro chatter en un duelo de dados.                   |
| `!adivinanza`   | `GET /api/adivinanza`       | Genera una adivinanza para que los espectadores intenten resolverla.         |
| `!8ball`        | `GET /api/8ball`            | Bola 8 mágica; responde una pregunta al azar.                                |
| `!dice`         | `GET /api/dice`             | Tira dados con formato tipo D&D (`d20`, `2d6`, etc.).                        |
| `!flip`         | `GET /api/flip`             | Lanza una moneda (cara / cruz).                                              |
| `!animal`       | `GET /api/animal`           | Devuelve el nombre y foto de un animal random.                               |
| `!superhero`    | `GET /api/superhero`        | Compara al usuario con un superhéroe al azar.                                |
| `!cumplido`     | `GET /api/cumplido`         | Manda un cumplido random al usuario.                                         |
| `!insulto`      | `GET /api/insulto`          | Manda un "insulto" (siempre en tono cómico) al usuario.                      |
| `!facha`        | `GET /api/facha`            | Muestra una imagen aleatoria "con facha".                                    |
| `!memide`       | `GET /api/memide`           | Muestra una imagen aleatoria de Memide.                                      |
| `!factos`       | `GET /api/factos`           | Devuelve un dato curioso / fun fact.                                         |

El endpoint `GET /api/commands` (visible desde la landing) devuelve la lista completa junto con la sintaxis de integración por plataforma.

---

## Cómo integrar en tu bot de Twitch

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

Cambia `ruleta` por cualquier otro comando de la tabla — todos siguen el mismo patrón.

---

## Bajo el capó

- **Framework:** Next.js 15 (Pages Router) con **React 19**.
- **Persistencia:** SQLite local (`database.db`) — usado por comandos con estado (economía, ruleta, historial).
- **UI de la landing:** TailwindCSS 4 + Radix UI + keep-react + Lucide/Phosphor.
- **Estructura:** cada comando es un handler bajo `pages/api/<comando>.js` que devuelve texto plano listo para chat.

---

## Setup local

```bash
git clone https://github.com/DarkSack/twitch_commands.git
cd twitch_commands
npm install
npm run dev            # http://localhost:3000
```

Deploy: cualquier plataforma serverless (Vercel recomendado — está pensado para eso).

---

## Estructura

```
twitch_commands/
├── pages/
│   ├── index.js           # Landing con lista de comandos
│   └── api/               # Un handler por comando
│       ├── ruleta.js
│       ├── ruletarusa.js
│       ├── duelo.js
│       ├── adivinanza.js
│       ├── 8ball.js
│       └── ...
├── commands/index.js      # Catálogo (nombre + descripción + uso por bot)
├── utils/functions.js     # Lógica de juegos (girarRuleta, tirarDados, ...)
├── lib/                   # Cliente SQLite, helpers
├── components/            # UI de la landing
└── database.db            # SQLite local
```

---

Hecho con ❤️ por **Sack**.
