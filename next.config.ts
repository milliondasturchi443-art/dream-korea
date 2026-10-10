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
};

export default nextConfig;
