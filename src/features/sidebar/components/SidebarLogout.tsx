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
        "flex w-full cursor-pointer items-center justify-between rounded-md bg-red-500 px-3 py-2 text-xs text-white transition-colors duration-200 hover:bg-red-600 active:bg-red-700";

    if (carregando) {
        return null;
    }

    if (!me) {
        return (
            <Link href="/login" onClick={closeSidebar} className={classe}>
                <span>Entrar</span>
                <span>›</span>
            </Link>
        );
    }

    async function handleLogout() {
        setSaindo(true);
        await sair();
        closeSidebar();
        setSaindo(false);
        router.push("/login");
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            disabled={saindo}
            className={classe}
        >
            <span>{saindo ? "Saindo..." : "Deslogar"}</span>
            <span>›</span>
        </button>
    );
}
