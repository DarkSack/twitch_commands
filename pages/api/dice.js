export default function handler(req, res) {
  const dice = Math.floor(Math.random() * 6) + 1;
  res.status(200).send(dice);
}
