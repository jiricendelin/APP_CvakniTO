import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CvakniTO",
    short_name: "CvakniTO",
    description: "Pokladní aplikace s fakturací",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#115E43",
    lang: "cs",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
