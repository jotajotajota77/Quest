import type { MetadataRoute } from "next";

// Manifest do PWA — torna o Quest instalável como "app" no celular, sem mudar
// nada do layout de desktop. (Item portado do app antigo, que era PWA.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quest — RPG comportamental",
    short_name: "Quest",
    description: "Motor de reforço com casca de RPG.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0612",
    theme_color: "#0a0612",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
