import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "情侣积分管理",
    short_name: "情侣积分",
    description: "双人共享、双方确认的情侣积分管理应用",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf7",
    theme_color: "#fff8ef",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ]
  };
}
