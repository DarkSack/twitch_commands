# 🎮 Twitch Commands

Dashboard y motor de **comandos para Twitch** con un sistema **RPG**, mini-juegos y economía. Construido con **Next.js 15 (App/Pages)**, **React 19**, **TailwindCSS 4** y persistencia local en **SQLite**.

---

## ✨ Características

- 💰 **Economía** con monedas virtuales por espectador.
- 🎯 **Duelos** entre chatters.
- 🎰 **Ruleta** y sistema de apuestas.
- 🔮 **Predicciones** con recompensa/penalización.
- 🐲 **Sistema RPG** con eventos aleatorios y progresión.
- 🧠 **Adivinanzas** con puntaje.
- 📊 **Estadísticas** por usuario.
- 🏪 **Mercado** interno.

---

## 🛠️ Stack

- **Framework:** Next.js 15 (React 19) — dev con Turbopack
- **UI:** TailwindCSS 4 · Radix UI (Tabs, Slot) · keep-react · lucide-react · phosphor-react
- **Estado / util:** clsx · classnames · class-variance-authority · tailwind-merge
- **Persistencia:** SQLite (`sqlite3`) → `database.db`
- **Extras:** react-syntax-highlighter · @tailwindcss/postcss

---

## 🚀 Comandos

```bash
# Instalar
npm install

# Desarrollo (con Turbopack)
npm run dev            # http://localhost:3000

# Build de producción
npm run build

# Servidor de producción
npm start

# Lint
npm run lint
```

---

## 🔐 Variables de entorno

Crea un archivo `.env.local` con las claves que uses:

```env
PORT=3000
# Configura aquí tus credenciales de Twitch, OAuth, etc.
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
TWITCH_BOT_TOKEN=...
```

---

## 📁 Estructura

```
twitch_commands/
├── pages/                # Rutas Next (App Router / Pages)
│   ├── api/              # Endpoints REST de comandos
│   ├── _app.js
│   └── index.js
├── commands/
│   └── index.js          # Registro central de comandos
├── components/           # UI (shadcn-style + Radix)
├── lib/                  # Cliente SQLite, helpers
├── utils/
├── styles/
├── public/
├── database.db           # Base local SQLite
├── next.config.mjs
└── package.json
```

---

## 📚 Categorías de endpoints

- 🎮 **Juegos** — `/api/roulette`, `/api/duel`, `/api/rpg`
- 💰 **Economía** — `/api/coins`, `/api/market`
- 🎲 **Predicciones** — `/api/predictions`
- 🧠 **Adivinanzas** — `/api/riddles`
- 📊 **Estadísticas** — `/api/stats`

> Los nombres exactos pueden variar; revisa `pages/api/` y `commands/index.js` para el mapa completo.

---

## 🤝 Contribución

_Issues_ y _pull requests_ bienvenidos.

---

## 📝 Licencia

MIT.

---

Hecho con ❤️ por **Sack**.
