"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { useSidebar } from "@/src/components/sidebar/SidebarProvider";

export default function SidebarLogout() {
    const router = useRouter();
    const { me, carregando, sair } = useSessao();
    const { closeSidebar } = useSidebar();
    const [saindo, setSaindo] = useState(false);

    const classe =
        "flex h-11 w-full cursor-pointer items-center justify-center rounded-xl font-display text-sm font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca disabled:opacity-60";

    if (carregando) {
        return null;
    }

    if (!me) {
        return (
            <Link href="/login" onClick={closeSidebar} className={`${classe} bg-marca text-white hover:bg-marca-escura`}>
                Entrar
            </Link>
        );
    }

    async function handleLogout() {
        setSaindo(true);
        await sair();
        closeSidebar();
        setSaindo(false);
        router.push("/");
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={saindo}
            className={`${classe} border-2 border-black/15 text-tinta hover:border-tinta`}
        >
            {saindo ? "Saindo..." : "Sair da conta"}
        </button>
    );
}
