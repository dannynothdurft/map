import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "APO MAP",
    short_name: "APO MAP",
    description: "Lieferrouten für die Apotheke AlphaPoint planen, verwalten und navigieren.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/map-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
