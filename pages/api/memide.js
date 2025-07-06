const { getEmoji } = require("@/utils/functions");

export default function handler(req, res) {
  // Genera un número aleatorio entre 0.5 y 30 con un decimal
  const medida = Number((Math.random() * 29.5 + 0.5).toFixed(1));
  // Función para determinar el emoji basado en el tamaño
  const emoji = getEmoji(medida);
  const response = `le mide ${medida}cm ${emoji}`;
  res.send(response);
}
