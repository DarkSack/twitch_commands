import { adivinanzas } from "@/utils/const";

export default function handler(req, res) {
  // Ejemplo: devolver una adivinanza aleatoria
  const random = adivinanzas[Math.floor(Math.random() * adivinanzas.length)];

  res.status(200).json({
    pregunta: random.pregunta,
    respuesta: random.respuesta,
    pista: random.pista,
  });
}
