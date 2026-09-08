/**
 * Datos de los comandos sin estado nuevos.
 *
 * Aparte de `const.js` a propósito: aquel fichero ya son 768 líneas y mezcla
 * el catálogo de items del juego con las listas de texto. Lo que hay aquí es
 * sólo relleno para comandos que no tocan la base de datos, y conviene poder
 * añadir una frase sin abrir el fichero del que depende la economía.
 */

export const TAROT = [
  ["El Loco", "empiezas algo sin saber a dónde va. Hazlo igual."],
  ["El Mago", "tienes las herramientas; te falta usarlas."],
  ["La Sacerdotisa", "hay algo que ya sabes y estás fingiendo no saber."],
  ["La Emperatriz", "cuida lo que has creado antes de crear más."],
  ["El Emperador", "pon límites o te los pondrán."],
  ["El Hierofante", "la respuesta aburrida es la correcta hoy."],
  ["Los Enamorados", "una elección, y las dos opciones cuestan algo."],
  ["El Carro", "avanza, pero mira el retrovisor."],
  ["La Fuerza", "no a la fuerza: con paciencia."],
  ["El Ermitaño", "hoy toca apagar el chat un rato."],
  ["La Rueda", "cambia solo. Ni mérito ni culpa tuya."],
  ["La Justicia", "te va a llegar exactamente lo que sembraste."],
  ["El Colgado", "espera. De verdad, espera."],
  ["La Muerte", "algo se acaba y llevas meses alargándolo."],
  ["La Templanza", "mezcla, no elijas."],
  ["El Diablo", "sabes cuál es el hábito. Ese."],
  ["La Torre", "se cae. Menos mal."],
  ["La Estrella", "respira: está saliendo bien aunque no lo parezca."],
  ["La Luna", "no te fíes de lo que crees estar viendo."],
  ["El Sol", "día bueno. Aprovéchalo sin buscarle pegas."],
  ["El Juicio", "revisa algo que diste por cerrado."],
  ["El Mundo", "cierras una etapa. Celébralo antes de la siguiente."],
];

export const SIGNOS = [
  "aries", "tauro", "geminis", "cancer", "leo", "virgo",
  "libra", "escorpio", "sagitario", "capricornio", "acuario", "piscis",
];

export const HOROSCOPOS = [
  "hoy discutes con alguien por una tontería y tienes razón, pero da igual.",
  "el universo te debe un favor y hoy te lo cobra en forma de café gratis.",
  "evita tomar decisiones importantes antes de comer. Ni una.",
  "alguien va a pedirte un favor. Di que sí, sale bien.",
  "tu suerte está de racha, pero se acaba a las 21:00. Corre.",
  "día de terminar cosas empezadas, no de empezar cosas nuevas.",
  "hoy te sale bien todo lo que hagas sin pensarlo mucho.",
  "cuidado con los mensajes largos: hoy te explicas fatal.",
  "vas a recordar algo que llevabas meses olvidando. Anótalo.",
  "tu paciencia se agota a media tarde. Planifica en consecuencia.",
  "buen día para pedir lo que llevas tiempo sin atreverte a pedir.",
  "algo que te daba pereza resulta ser lo mejor del día.",
];

export const CLASES_RPG = [
  ["Bárbaro", "grita primero, pregunta nunca"],
  ["Bardo", "resuelve todo hablando y a veces funciona"],
  ["Clérigo", "cura al grupo y se queja de ello"],
  ["Druida", "se convierte en oso cuando la conversación se pone difícil"],
  ["Explorador", "sabe dónde está todo menos el grupo"],
  ["Guerrero", "el plan es pegar"],
  ["Monje", "pega más rápido que tu turno"],
  ["Paladín", "juramento inquebrantable, memoria selectiva"],
  ["Pícaro", "ya te ha robado la cartera"],
  ["Hechicero", "poder heredado, control ninguno"],
  ["Brujo", "firmó algo sin leerlo"],
  ["Mago", "tiene el conjuro perfecto y lo preparó ayer"],
  ["Artificiero", "lo arregla con cinta y magia"],
];

export const TRASFONDOS = [
  "huérfano de taberna", "noble arruinado", "ex guardia de ciudad",
  "erudito expulsado", "marinero desertor", "artista callejero",
  "ermitaño cotilla", "contrabandista jubilado", "acólito descreído",
  "cazarrecompensas sentimental", "granjero con secretos", "heredero fugado",
];

export const SALAS_MAZMORRA = [
  "una sala inundada hasta las rodillas, con algo moviéndose debajo",
  "un pasillo con doce puertas idénticas y once trampas",
  "una biblioteca donde los libros susurran mal de ti",
  "una cripta con un sarcófago ya abierto por dentro",
  "un puente de cuerda sobre un foso sin fondo visible",
  "una cocina abandonada con el fuego todavía encendido",
  "un salón del trono vacío, con el trono ocupado",
  "una escalera de caracol que baja más de lo que el mapa permite",
  "un jardín subterráneo con setas del tamaño de un caballo",
  "una forja apagada llena de armas a medio hacer",
  "una celda con la puerta cerrada desde dentro",
  "un pozo de monedas donde ninguna es de este reino",
];

export const HABITANTES = [
  "tres goblins jugando a las cartas", "un oso lechuza de mal humor",
  "un esqueleto que sólo quiere hablar", "un limo que ya se comió a alguien",
  "un dragón joven y muy inseguro", "un fantasma que no sabe que lo es",
  "dos bandidos discutiendo el reparto", "una estatua que respira",
  "un mímico haciéndose el cofre", "nada, y eso es lo preocupante",
];

export const BOTINES = [
  "una daga oxidada pero con historia", "47 monedas de cobre y un botón",
  "un anillo que brilla cuando mientes", "un mapa a medio quemar",
  "tres pociones sin etiqueta", "una capa que huele a perro mojado",
  "un yelmo abollado del tamaño equivocado", "una gema que vale mucho o nada",
  "un libro de conjuros en un idioma inventado", "una llave sin cerradura conocida",
  "botas que caminan solas hacia el peligro", "un cuerno que llama a algo",
];

export const NOMBRES_INICIO = [
  "Thal", "Bren", "Kaer", "Mor", "Sil", "Dur", "Ery", "Grim",
  "Val", "Nyx", "Ald", "Fen", "Ros", "Zar", "Hel", "Ivar",
];

export const NOMBRES_FIN = [
  "dor", "wyn", "rak", "mira", "thas", "eth", "gorn", "lys",
  "vain", "drel", "mund", "sara", "quen", "bal", "nier", "ric",
];

export const TITULOS_RPG = [
  "el Indeciso", "Rompepuertas", "el Que No Duerme", "de la Mano Torcida",
  "el Último", "Cuentacuentos", "el Que Volvió", "Sinsombra",
  "el Puntual", "de los Nueve Dedos", "el Barato", "Matadragones (sin pruebas)",
];

export const RETOS_STREAM = [
  "juega la siguiente partida sin usar la habilidad principal",
  "no puedes hablar durante 2 minutos, sólo emotes en el chat",
  "el chat elige tu próximo objetivo y no puedes discutirlo",
  "cada muerte son 10 flexiones. Contamos nosotros",
  "juega invertido: ratón al otro lado del teclado",
  "la próxima partida, coméntala como si fuera fútbol",
  "prohibido curarse hasta el siguiente checkpoint",
  "usa sólo el arma inicial hasta que alguien done",
  "narra todo lo que haces en voz alta, sin parar",
  "cambia a la peor sensibilidad que soportes durante 10 minutos",
  "si pierdes, el chat elige el título del stream",
  "juega de pie el resto de la partida",
];

export const EXCUSAS = [
  "iba el servidor fatal, se veía clarísimo",
  "me han hecho stream sniping, es evidente",
  "el ratón se desconectó justo en ese momento",
  "es que este mando ya está viejo",
  "estaba leyendo el chat, culpa vuestra",
  "me ha entrado una notificación en el peor momento",
  "el juego decidió que ese disparo no contaba",
  "tenía lag, mirad el ping. Bueno, no lo miréis",
  "es que no había calentado todavía",
  "el equipo no colaboró, yo hice lo que pude",
  "se me cruzó el gato por delante de la pantalla",
  "estaba probando una estrategia nueva, no lo entenderíais",
];

export const TITULOS_STREAM = [
  ["Último día de", "antes de borrarlo"],
  ["Hoy SÍ llegamos a", "(mentira)"],
  ["Probando", "porque el chat insistió"],
  ["Estamos en", "y no pienso salir"],
  ["Nadie ha hecho esto en", "por algo será"],
  ["Reto imposible en", "día 1"],
  ["Volvemos a", "después de jurar que no"],
  ["24h de", "(son 2h)"],
  ["Explicando", "sin tener ni idea"],
  ["Rankeds de", "hasta que me eche a llorar"],
];

export const JUEGOS_TITULO = [
  "Minecraft", "Elden Ring", "Valorant", "League of Legends", "Fortnite",
  "Dark Souls", "Rocket League", "Stardew Valley", "Terraria", "GTA V",
  "Counter-Strike", "Hollow Knight", "Among Us", "Roblox", "Apex Legends",
];

export const PREGUNTAS_CHAT = [
  "¿pizza con piña: sí o no? Justificad",
  "¿cuál es la peor película que habéis visto entera?",
  "¿qué juego abandonasteis y os arrepentís?",
  "¿mejor banda sonora de videojuego? Sólo una",
  "¿café o té? Y no valen los dos",
  "¿cuál fue vuestro primer videojuego?",
  "¿qué comida no soportáis y todo el mundo adora?",
  "¿serie que veríais otra vez desde cero?",
  "¿qué habilidad inútil tenéis?",
  "¿peor compra que habéis hecho por internet?",
  "¿gato o perro? Se admiten razonamientos largos",
  "¿qué canción se os queda pegada siempre?",
];

export const ABRAZOS = [
  "le da un abrazo de oso a", "abraza muy fuerte a", "se lanza a los brazos de",
  "envuelve en un abrazo incómodo pero sincero a", "abraza por sorpresa a",
  "le da un abrazo de tres segundos exactos a",
];

export const ZAPES = [
  "le da un zape con la mano abierta a", "le lanza una chancla a",
  "le da un capón a", "le tira un cojín a", "le da con el periódico a",
  "le pega con una baguette a",
];

/** Baraja francesa para `!carta`. */
export const PALOS = ["♠ picas", "♥ corazones", "♦ diamantes", "♣ tréboles"];
export const VALORES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** Tabla de morse. Lo que no esté aquí se sustituye por "?". */
export const MORSE = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.",
  h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.",
  o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-",
  v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", "ñ": "--.--",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "'": ".----.",
};
