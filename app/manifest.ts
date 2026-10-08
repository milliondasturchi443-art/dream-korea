import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DREAM KOREA",
    short_name: "DREAM KOREA",
    description: "Koreys tili o‘quv markazi — kurslar, TOPIK testlar, Axrorbek AI",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1b3d",
    theme_color: "#0f1b3d",
    icons: [
      { src: "/adminapklogo.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "1254x1254", type: "image/png", purpose: "any" },
    ],
  };
}
