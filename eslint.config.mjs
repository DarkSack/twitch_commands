// eslint-config-next 16 ya publica configuración plana, así que sobra el
// puente con FlatCompat que hacía falta en la 15.
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**"] },
  ...nextVitals,
];

export default eslintConfig;
