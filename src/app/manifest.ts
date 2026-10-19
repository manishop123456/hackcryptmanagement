import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DevClub Management & Accountability System",
    short_name: "DevClub QA",
    description: "Internal operations, attendance, and accountability platform for DevClub TRCAC",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0c0e13",
    theme_color: "#0c0e13",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
