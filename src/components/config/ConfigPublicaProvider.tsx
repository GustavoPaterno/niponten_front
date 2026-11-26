"use client";

import { createContext, useContext } from "react";

/**
 * Valores de configuração que o navegador precisa (chaves públicas de Google Maps e Mercado Pago).
 *
 * Eles vêm de variáveis de ambiente comuns, sem o prefixo NEXT_PUBLIC_: o layout raiz, que roda no
 * servidor, lê o `process.env` (ver `lerConfigPublica`) e entrega os valores aqui. Só coloque aqui o
 * que pode ir para o navegador: tudo neste contexto acaba no HTML da página.
 */
export interface ConfigPublica {
    /** Chave de navegador do Google Maps (Maps JavaScript API). Vazia = mapa indisponível. */
    googleMapsApiKey: string;
    /** Map ID do Google Cloud, exigido pelo pino arrastável. */
    googleMapsMapId: string;
    /** Public key do Mercado Pago, usada pelo Card Payment Brick. Vazia = sem cartão online. */
    mercadoPagoPublicKey: string;
}

const ConfigPublicaContext = createContext<ConfigPublica | null>(null);

export function ConfigPublicaProvider({ config, children }: { config: ConfigPublica; children: React.ReactNode }) {
    return <ConfigPublicaContext.Provider value={config}>{children}</ConfigPublicaContext.Provider>;
}

export function useConfigPublica(): ConfigPublica {
    const config = useContext(ConfigPublicaContext);

    if (!config) {
        throw new Error("useConfigPublica precisa estar dentro de ConfigPublicaProvider");
    }

    return config;
}
