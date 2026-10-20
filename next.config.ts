import type { NextConfig } from "next";

// As chamadas ao backend (nippon-ten) vão para /backend/*, que é atendido pelo proxy em
// src/app/backend/[...path]/route.ts (lê BACKEND_URL, padrão http://localhost:8080).
// Não use rewrite aqui: o rewrite repassa o header Origin do navegador e o CORS do backend
// responde 403 nos POST/PUT/DELETE; além disso, ele tem prioridade sobre o proxy.
const nextConfig: NextConfig = {};

export default nextConfig;
