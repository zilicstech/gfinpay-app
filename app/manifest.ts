import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gfinpay",
    short_name: "Gfinpay",
    description: "Assisted digital banking for retailers, distributors, and enterprises",
    start_url: "/login",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
