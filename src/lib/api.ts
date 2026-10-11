import { createNipponTenClient } from "nippon-ten-api-client";

// Instância única do SDK. A base "/backend" é reescrita pelo next.config.ts para o backend real.
// Só deve ser usada em código que roda no navegador (componentes "use client").
export const api = createNipponTenClient("/backend");
