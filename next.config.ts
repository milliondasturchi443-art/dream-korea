import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Telefon uchun alohida yashirin yo'l — ichkarida asosiy admin panel xizmat qiladi
    return [
      {
        source: "/adminstrationpanelofdreamkoreaphone",
        destination: "/adminstrationpanelofdreamkorea",
      },
      {
        source: "/adminstrationpanelofdreamkoreaphone/:path*",
        destination: "/adminstrationpanelofdreamkorea/:path*",
      },
    ];
  },
  async headers() {
    // Optimaizatsiya: og'ir statika (kitoblar, APK, video, logotiplar) 7 kun brauzer keshida
    // qoladi — qayta tashrifda yuklab olinmaydi, sahifa sezilarli tez ochiladi.
    return [
      {
        source: "/:file.:ext",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/books/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
