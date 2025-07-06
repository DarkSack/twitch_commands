import { Grid } from "@/components/ui/Grid";
import Image from "next/image";

export default function Home() {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Grid>
        <Image
          alt=""
          width={1500}
          height={600}
          src="https://staticmania.cdn.prismic.io/staticmania/aa469681-b2d1-4384-a990-91906711a24d_Property+1%3DNight+sky_+Property+2%3DSm.svg"
        />
      </Grid>
      <center bg="primary.400" p="20">
        <span>ESTAMOS TRABAJANDO AQUI...</span> <br />
        <span>PUEDES AYUDARNOS COOLABORANDO...</span> <br />
        <a href="https://github.com/DarkSack/twitch_commands">
          ⚒️ COOLABORAR 🛠️
        </a>
        <br />
        <span>GRACIAS...</span>
      </center>
    </>
  );
}
