"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MenuIcon from "@mui/icons-material/Menu";
import { ShoppingBagOutlined } from "@mui/icons-material";
import { useSessao } from "@/src/components/auth/SessaoProvider";
import { useSidebar } from "@/src/components/sidebar/SidebarProvider";
import { quantidadeTotal, useCarrinho } from "@/src/lib/carrinho";

/**
 * Barra do topo, igual em todas as telas do app: menu, marca, conta e carrinho.
 * Quem não entrou vê "Entrar" aqui; a loja fica aberta para navegar sem conta.
 */
export default function Header() {
    const { me, carregando } = useSessao();
    const { openSidebar } = useSidebar();
    // O admin usa a largura toda (quadro de pedidos, tabelas); a loja fica centralizada.
    const largo = usePathname().startsWith("/admin");
    const totalCarrinho = quantidadeTotal(useCarrinho());

    const nome = me?.name?.trim() || me?.email || "";
    const primeiroNome = nome.split(/[\s@]/)[0];

    return (
        <header className="fixed top-0 z-40 h-16 w-full bg-marca text-white">
            <div className={`mx-auto flex h-full items-center gap-1 pr-3 sm:pr-5 ${largo ? "" : "max-w-6xl"}`}>
                <button
                    type="button"
                    onClick={openSidebar}
                    aria-label="Abrir menu"
                    className="flex h-full w-14 shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                >
                    <MenuIcon />
                </button>

                <Link
                    href="/"
                    className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-white"
                >
                    <Image
                        src="/images/marusan-logo.jpg"
                        alt=""
                        width={44}
                        height={44}
                        className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/70"
                    />
                    <span className="truncate font-display text-xl font-extrabold tracking-tight sm:text-2xl">
                        Marusan
                    </span>
                </Link>

                <nav aria-label="Conta e carrinho" className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {carregando ? (
                        <span className="h-9 w-20" aria-hidden="true" />
                    ) : me ? (
                        <button
                            type="button"
                            onClick={openSidebar}
                            title={nome}
                            className="flex h-9 max-w-[140px] cursor-pointer items-center gap-2 rounded-full pl-1 pr-1 text-sm font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white sm:pr-3"
                        >
                            <span
                                aria-hidden="true"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-extrabold uppercase text-marca"
                            >
                                {primeiroNome.charAt(0)}
                            </span>
                            <span className="hidden truncate sm:block">{primeiroNome}</span>
                            <span className="sr-only">Minha conta</span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className="flex h-9 items-center rounded-full bg-white px-4 font-display text-sm font-bold text-marca hover:bg-mostarda hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            Entrar
                        </Link>
                    )}

                    <Link
                        href="/carrinho"
                        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
                        aria-label={
                            totalCarrinho > 0
                                ? `Carrinho com ${totalCarrinho} ${totalCarrinho === 1 ? "item" : "itens"}`
                                : "Carrinho vazio"
                        }
                    >
                        <ShoppingBagOutlined />

                        {totalCarrinho > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-mostarda px-1 font-display text-[11px] font-extrabold leading-none text-tinta">
                                {totalCarrinho > 99 ? "99+" : totalCarrinho}
                            </span>
                        )}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
