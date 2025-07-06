export default function handler(req, res) {
  const facha = (Math.random() * 100).toFixed(1);
  res.status(200).send(`tiene una facha de ${facha}%`);
}
