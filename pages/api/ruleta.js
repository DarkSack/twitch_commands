import { girarRuleta } from "../../utils/functions";

export default async function handler(req, res) {
  try {
    const usuario = req.query.usuario;
    if (!usuario) {
      return res.status(400).send("❌ Debes proporcionar un usuario.");
    }
    const resultado = await girarRuleta(usuario);
    res.status(200).send(resultado);
  } catch (error) {
    console.error("Error en el endpoint:", error);
    res.status(500).send("Error interno del servidor");
  }
}
