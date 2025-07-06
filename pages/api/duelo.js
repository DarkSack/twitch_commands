import { realizarDuelo } from "../../utils/functions";

export default async function handler(req, res) {
  try {
    const { retador, retado, monedas } = req.query;

    const resultado = await realizarDuelo(retador, retado, monedas);
    res.status(200).send(resultado);
  } catch (error) {
    console.error("Error en el endpoint:", error);
    res.status(500).send("Error interno del servidor");
  }
}
