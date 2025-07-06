export default function handler(req, res) {
  const flip = ["Cara", "Cruz"][Math.floor(Math.random() * 2)];
  res.status(200).send(flip);
}
