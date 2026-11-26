import type { ConfigPublica } from "@/src/components/config/ConfigPublicaProvider";

/** Lê do ambiente do servidor os valores que o navegador precisa (ver `ConfigPublicaProvider`). */
export function lerConfigPublica(): ConfigPublica {
    return {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
        // O pino arrastável (AdvancedMarker) exige um Map ID. DEMO_MAP_ID serve para desenvolvimento.
        googleMapsMapId: process.env.GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
        mercadoPagoPublicKey: process.env.MERCADOPAGO_PUBLIC_KEY ?? "",
    };
}
