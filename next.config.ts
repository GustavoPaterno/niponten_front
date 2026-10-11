import type { NextConfig } from "next";

// Endereço do backend (nippon-ten). O navegador nunca fala direto com ele: as chamadas
// vão para /backend/* no próprio Next, que repassa para cá. Assim não há problema de CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
