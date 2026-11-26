"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { buscarMe, sair as sairDaApi, type Me } from "@/src/lib/auth";
import { limparCarrinho } from "@/src/lib/carrinho";
import { ApiError } from "@/src/lib/http";
import { ouvirTrocaDeSessao } from "@/src/lib/sessaoEntreAbas";

// Mesmo usuário com os mesmos dados: mantém o objeto, para quem depende de `me` não recarregar.
function mesmoUsuario(a: Me | null, b: Me | null): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

interface SessaoContextType {
    /** Usuário logado; `null` quando não há sessão. */
    me: Me | null;
    /** true até a primeira consulta ao /auth/me terminar. */
    carregando: boolean;
    recarregar: () => Promise<void>;
    sair: () => Promise<void>;
}

const SessaoContext = createContext<SessaoContextType | null>(null);

export function useSessao() {
    const context = useContext(SessaoContext);

    if (!context) {
        throw new Error("useSessao deve ser usado dentro do SessaoProvider");
    }

    return context;
}

/**
 * Busca o usuário logado (GET /auth/me) e o compartilha com o header, a sidebar e as páginas.
 * Confere de novo quando outra aba entra ou sai da conta e quando a aba volta a ficar visível,
 * porque o cookie do login é um só para o navegador todo (ver src/lib/sessaoEntreAbas.ts).
 */
export default function SessaoProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [me, setMe] = useState<Me | null>(null);
    const [carregando, setCarregando] = useState(true);

    const recarregar = useCallback(async () => {
        try {
            setMe(await buscarMe());
        } catch {
            setMe(null);
        } finally {
            setCarregando(false);
        }
    }, []);

    const sair = useCallback(async () => {
        await sairDaApi();
        // O carrinho fica no navegador: sem isso, quem entrasse depois veria os itens de quem saiu.
        limparCarrinho();
        setMe(null);
    }, []);

    // Busca inicial. Os setState ficam nos callbacks da promise (não no corpo do efeito),
    // e `cancelado` evita atualizar o estado depois que o componente sai da tela.
    useEffect(() => {
        let cancelado = false;

        buscarMe()
            .then((usuario) => {
                if (!cancelado) {
                    setMe(usuario);
                }
            })
            .catch(() => {
                // 401 (sem login) ou backend fora do ar: segue como visitante.
                if (!cancelado) {
                    setMe(null);
                }
            })
            .finally(() => {
                if (!cancelado) {
                    setCarregando(false);
                }
            });

        return () => {
            cancelado = true;
        };
    }, []);

    // Conferência depois da carga inicial. Só 401/403 tiram a sessão: uma falha de rede passageira
    // não pode deslogar a aba.
    useEffect(() => {
        const conferir = () => {
            buscarMe()
                .then((usuario) => setMe((atual) => (mesmoUsuario(atual, usuario) ? atual : usuario)))
                .catch((e) => {
                    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                        setMe(null);
                    }
                });
        };
        const aoVoltar = () => {
            if (document.visibilityState === "visible") {
                conferir();
            }
        };

        const pararDeOuvir = ouvirTrocaDeSessao(conferir);
        document.addEventListener("visibilitychange", aoVoltar);

        return () => {
            pararDeOuvir();
            document.removeEventListener("visibilitychange", aoVoltar);
        };
    }, []);

    return (
        <SessaoContext.Provider value={{ me, carregando, recarregar, sair }}>
            {children}
        </SessaoContext.Provider>
    );
}
