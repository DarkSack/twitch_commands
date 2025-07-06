import { premios } from "@/utils/const";

export default async function handler(req, res) {
  try {
    const usuario = req.query.usuario;

    // Simular la ruleta rusa con 6 posiciones (1 bala, 5 vacías)
    const posiciones = [true, false, false, false, false, false];
    const posicionActual = Math.floor(Math.random() * 6);
    const tieneBala = posiciones[posicionActual];

    // Generar un mensaje más detallado
    const resultado = {
      usuario,
      posicion: posicionActual + 1,
      resultado: tieneBala ? "💥 ¡BOOM! Has perdido" : "🎉 ¡Click! Has ganado",
      bala: tieneBala,
    };

    // Si el usuario pierde, aplicar un premio negativo
    if (tieneBala) {
      const premioNegativo = premios.find(
        (p) => p.mensaje === "😢 Perdiste 50 monedas"
      );
      resultado.premio = {
        mensaje: premioNegativo.mensaje,
        dinero: premioNegativo.dinero,
      };
    } else {
      // Si gana, dar una recompensa aleatoria
      const premioPositivo = premios.filter((p) => p.dinero > 0)[
        Math.floor(Math.random() * 3)
      ];
      resultado.premio = {
        mensaje: premioPositivo.mensaje,
        dinero: premioPositivo.dinero,
      };
    }

    res.status(200).send(resultado.resultado);
  } catch (error) {
    console.error("Error en el endpoint:", error);
    res.status(500).send("Error interno del servidor");
  }
}
