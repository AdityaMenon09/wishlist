import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WishList",
    short_name: "WishList",
    description: "Personal wishlist, price tracker and expense log.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1222",
    theme_color: "#0b1222",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Lets the installed app appear in Android's share sheet (e.g. from the Amazon app).
    share_target: {
      action: "/capture",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  } as MetadataRoute.Manifest;
}
