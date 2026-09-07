import { aplicarPremioRuletaRusa } from "@/utils/functions";
import { fallo, parametro, texto, usuarioValido } from "@/utils/respond";

/**
 * Ruleta rusa: 1 bala en 6 posiciones.
 *
 * Tenia tres fallos, y el primero se veia en produccion:
 *
 * 1. Al ganar elegia el premio con `filter(...)[Math.floor(Math.random() * 3)]`,
 *    con un 3 escrito a mano. Solo hay DOS premios con dinero positivo, asi
 *    que un tercio de las victorias daba `undefined` y reventaba al leer
 *    `.mensaje`. Medido contra el servidor: 10 de 40 llamadas devolvian 500.
 * 2. Calculaba el premio y no lo aplicaba nunca: construia `resultado.premio`
 *    y enviaba solo el texto. Las monedas jamas cambiaban.
 * 3. Leia `usuario` sin usarlo.
 */
export default async function handler(req, res) {
  try {
    const usuario = usuarioValido(parametro(req, "usuario"));
    if (!usuario) {
      return fallo(res, 400, "❌ Falta el usuario. Usa ?usuario=tu_nombre");
    }

    // 1 bala entre 6 posiciones.
    const tieneBala = Math.floor(Math.random() * 6) === 0;
    const resultado = await aplicarPremioRuletaRusa(usuario, tieneBala);

    return texto(res, resultado);
  } catch (error) {
    console.error("[ruletarusa]", error);
    return fallo(res, 500, "❌ Error interno del servidor");
  }
}
