import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "CMT Detailing Admin",
    short_name:       "CMT Admin",
    description:      "CMT Detailing business dashboard",
    start_url:        "/admin/dashboard",
    display:          "standalone",
    background_color: "#151b23",
    theme_color:      "#151b23",
    orientation:      "portrait-primary",
    icons: [
      {
        src:     "/icons/icon-192.png",
        sizes:   "192x192",
        type:    "image/png",
        purpose: "maskable",
      },
      {
        src:   "/icons/icon-512.png",
        sizes: "512x512",
        type:  "image/png",
      },
    ],
  };
}
