import { ship } from "@/utils/diversion";
import { fallo, parametro, texto } from "@/utils/respond";

/**
 * `!ship fulano` o `!ship fulano mengano`.
 *
 * Con un solo nombre se compara contra quien escribe, que es como se usa de
 * verdad en el chat; con dos, se comparan esos dos. NO se valida con
 * `usuarioValido`: aquí se emparejan cosas, no cuentas de Twitch, y "piña" o
 * "pizza" son entradas legítimas.
 */
export default function handler(req, res) {
  // `otro` es el nombre que genera `ejemploNightbot`; `q` es el que mandan
  // otros bots. Sin leer los dos, el ejemplo que se copia de la portada no
  // funcionaba: llegaba `?otro=fulano` y aqui solo se miraba `q`.
  const libre = parametro(req, "otro") ?? parametro(req, "q") ?? "";
  const partes = libre.split(/\s+/).filter(Boolean);
  const yo = parametro(req, "usuario");
  const a = parametro(req, "a") ?? (partes.length >= 2 ? partes[0] : yo);
  const b = parametro(req, "b") ?? (partes.length >= 2 ? partes[1] : partes[0]);

  if (!a || !b) return fallo(res, 400, "❌ Uso: !ship <nombre> [otro nombre]");

  const corto = (v) => String(v).replace(/^@+/, "").slice(0, 25);
  return texto(res, ship(corto(a), corto(b)));
}
