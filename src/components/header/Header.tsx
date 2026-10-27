"use client";

import Image from "next/image";
import Link from "next/link";
import MenuIcon from "@mui/icons-material/Menu";
import { ShoppingCartOutlined } from "@mui/icons-material";
import { useSessao } from "@/src/components/auth/SessaoProvider";
import { useSidebar } from "@/src/components/sidebar/SidebarProvider";

export default function Header() {
    const { me, carregando } = useSessao();
    const { openSidebar } = useSidebar();

    const nome = me?.name?.trim() || me?.email || "";

    return (
        <header className="fixed top-0 z-50 h-20 w-full bg-(--primary)">
            <div className="flex h-full items-center">
                <button
                    type="button"
                    onClick={openSidebar}
                    aria-label="Abrir menu lateral"
                    className="flex w-16 h-full shrink-0 cursor-pointer items-center justify-center">
                    <MenuIcon fontSize="large" />
                    </button>
                <div className="flex min-w-0 h-full gap-2 flex-1 items-center">
                    <Image
                        src="/images/marusan-logo.jpg"
                        alt="Logo Marusan"
                        width={60}
                        height={60}
                        className="h-13 w-13 shrink-0 rounded-4xl md:h-16 md:w-16"
                    />

                    <span className="ml-2 truncate text-5lg font-bold sm:text-3xl">
                        MARUSAN
                    </span>
                </div>

                <div className="flex h-full shrink-0 items-center justify-end gap-4 pr-4 sm:gap-5 sm:pr-6">
                    <div>
                        <ShoppingCartOutlined fontSize="large" />
                    </div>
                    <div className="min-w-0">
                        {carregando ? null : me ? (
                            <span
                                className="block max-w-[110px] truncate text-5sm font-bold"
                                title={nome}
                            >
                                {nome}
                            </span>
                        ) : (
                            <Link href="/login" className="text-5sm font-bold">
                                Entrar
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}