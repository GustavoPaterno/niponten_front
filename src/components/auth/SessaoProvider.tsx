"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { buscarMe, sair as sairDaApi, type Me } from "@/src/lib/auth";

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

/** Busca o usuário logado (GET /auth/me) uma vez e o compartilha com o header, a sidebar e as páginas. */
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
        setMe(null);
    }, []);

    useEffect(() => {
        void recarregar();
    }, [recarregar]);

    return (
        <SessaoContext.Provider value={{ me, carregando, recarregar, sair }}>
            {children}
        </SessaoContext.Provider>
    );
}
