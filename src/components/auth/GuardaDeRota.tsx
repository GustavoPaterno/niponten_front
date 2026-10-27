"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { LockOutlined } from "@mui/icons-material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { destinoAposLogin, itemDaRota, podeAcessar } from "@/src/lib/navegacao";

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
            router.replace("/login");
        }
    }, [semLogin, router]);

    if (carregando || semLogin) {
        return (
            <div className="flex justify-center py-16">
                <CircularProgress size={32} sx={{ color: "#EE2C2E" }} />
            </div>
        );
    }

    const permitido = item ? podeAcessar(me, item) : me?.type === "INTERNAL";

    if (!permitido) {
        return (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center text-black">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500">
                    <LockOutlined />
                </div>

                <h1 className="text-xl font-semibold">
                    Você não tem acesso a esta página
                </h1>

                <p className="text-sm text-gray-500">
                    Se precisar dela, peça a um administrador para liberar a permissão
                    no seu cargo.
                </p>

                <Link
                    href={me ? destinoAposLogin(me) : "/menu"}
                    className="mt-2 rounded-md bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600"
                >
                    Voltar para o início
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
