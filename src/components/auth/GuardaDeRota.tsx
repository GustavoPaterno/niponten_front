"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { destinoAposLogin, itemDaRota, linkDeAcesso, podeAcessar } from "@/src/lib/navegacao";

/**
 * Protege as páginas administrativas quando acessadas direto pela URL:
 * sem login vai para /login; sem a permissão da página mostra um aviso.
 * (O backend continua sendo quem de fato bloqueia: isto só evita mostrar a tela.)
 */
export default function GuardaDeRota({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { me, carregando } = useSessao();

    const item = itemDaRota(pathname);
    const semLogin = !carregando && !me;

    useEffect(() => {
        if (semLogin) {
            // Depois de entrar, volta para a página que a pessoa tentou abrir.
            router.replace(linkDeAcesso("/login", pathname));
        }
    }, [semLogin, router, pathname]);

    if (carregando || semLogin) {
        return (
            <div className="flex justify-center py-16">
                <CircularProgress size={32} sx={{ color: "var(--primary)" }} />
            </div>
        );
    }

    const permitido = item ? podeAcessar(me, item) : me?.type === "INTERNAL";

    if (!permitido) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center text-tinta">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-marca/10 text-marca">
                    <LockOutlined />
                </div>

                <h1 className="font-display text-xl font-extrabold">
                    Você não tem acesso a esta página
                </h1>

                <p className="text-sm text-tinta-suave">
                    Se precisar dela, peça a um administrador para liberar a permissão
                    no seu cargo.
                </p>

                <Link
                    href={me ? destinoAposLogin(me) : "/"}
                    className="mt-2 rounded-xl bg-marca px-5 py-2.5 font-display text-sm font-bold text-white transition-colors hover:bg-marca-escura"
                >
                    Voltar para o início
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
