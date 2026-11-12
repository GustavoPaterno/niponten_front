"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { formatCurrency } from "@/src/lib/format";
import { quantidadeTotal, totalDoItem, useCarrinho } from "@/src/lib/carrinho";

/** Telas onde a barra atrapalha: o próprio carrinho, o produto (tem botão de adicionar) e o admin. */
function escondeEm(pathname: string): boolean {
    return (
        pathname === "/carrinho" ||
        pathname.startsWith("/menu/produto") ||
        pathname.startsWith("/admin")
    );
}

/**
 * Atalho fixo para o carrinho, como nos apps de delivery: aparece assim que o primeiro item
 * entra e mostra quantos itens e quanto já deu.
 */
export default function BarraCarrinho() {
    const pathname = usePathname();
    const itens = useCarrinho();
    const quantidade = quantidadeTotal(itens);

    if (quantidade === 0 || escondeEm(pathname)) {
        return null;
    }

    const total = itens.reduce((soma, item) => soma + totalDoItem(item), 0);

    return (
        <>
            {/* Reserva o espaço da barra para ela não cobrir o fim da página. */}
            <div aria-hidden="true" className="h-24" />

            <div className="barra-carrinho fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-5">
                <Link
                    href="/carrinho"
                    className="mx-auto flex h-14 max-w-xl items-center gap-3 rounded-2xl bg-marca pl-2 pr-5 text-white shadow-[0_10px_30px_-8px_rgba(179,25,28,0.6)] hover:bg-marca-escura focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tinta"
                >
                    <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-mostarda px-2 font-display text-lg font-extrabold text-tinta">
                        {quantidade}
                    </span>
                    <span className="flex-1 font-display text-base font-bold">Ver carrinho</span>
                    <span className="font-display text-lg font-extrabold">{formatCurrency(total)}</span>
                </Link>
            </div>
        </>
    );
}
