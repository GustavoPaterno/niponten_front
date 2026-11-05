import Link from "next/link";
import { ChevronRight } from "@mui/icons-material";

import { formatCurrency, formatDate } from "@/src/lib/format";
import type { ItemCombo, ItemProduto, ItemPromocao } from "@/src/services/cardapio";

import ImagemItem from "./ImagemItem";

// Card dos carrosséis: largura fixa para o próximo card "espiar" na borda e indicar o scroll.
const CARD =
    "group flex w-[68vw] max-w-[250px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-transform active:scale-[0.98]";

export function CardPromocao({ item }: { item: ItemPromocao }) {
    return (
        <Link href={item.href} className={CARD}>
            <div className="relative">
                <ImagemItem src={item.imagem} alt={item.nome} className="aspect-[4/3] w-full" />

                {item.desconto > 0 && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-(--primary) px-2.5 py-1 text-xs font-bold text-white shadow-md">
                        -{item.desconto}%
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="line-clamp-1 font-semibold text-neutral-900">{item.nome}</h3>

                {item.descricao && (
                    <p className="line-clamp-2 text-xs leading-snug text-neutral-500">
                        {item.descricao}
                    </p>
                )}

                <div className="mt-auto pt-2">
                    {item.variosPrecos && (
                        <span className="block text-[11px] text-neutral-500">a partir de</span>
                    )}

                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-(--primary)">
                            {formatCurrency(item.precoPromocional)}
                        </span>

                        <span className="text-xs text-neutral-400 line-through">
                            {formatCurrency(item.precoOriginal)}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function CardCombo({ item }: { item: ItemCombo }) {
    return (
        <Link href={item.href} className={CARD}>
            <div className="relative">
                <ImagemItem src={item.imagem} alt={item.nome} className="aspect-[4/3] w-full" />

                <span className="absolute left-2.5 top-2.5 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    Combo
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="line-clamp-1 font-semibold text-neutral-900">{item.nome}</h3>

                {item.descricao && (
                    <p className="line-clamp-2 text-xs leading-snug text-neutral-500">
                        {item.descricao}
                    </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <span className="text-lg font-bold text-neutral-900">
                        {formatCurrency(item.preco)}
                    </span>

                    {item.validoAte && (
                        <span className="text-[11px] text-neutral-500">
                            até {formatDate(item.validoAte).slice(0, 5)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function LinhaProduto({ item }: { item: ItemProduto }) {
    return (
        <Link
            href={item.href}
            className="flex items-center gap-3 py-4 transition-colors active:bg-neutral-50"
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="line-clamp-1 font-semibold text-neutral-900">{item.nome}</h3>

                {item.descricao && (
                    <p className="line-clamp-2 text-sm leading-snug text-neutral-500">
                        {item.descricao}
                    </p>
                )}

                <p className="mt-1 text-sm text-neutral-900">
                    {item.variosPrecos && (
                        <span className="text-neutral-500">a partir de </span>
                    )}
                    <span className="font-bold">{formatCurrency(item.precoMinimo)}</span>
                </p>
            </div>

            <ImagemItem
                src={item.imagem}
                alt={item.nome}
                className="h-24 w-24 shrink-0 rounded-xl"
            />

            <ChevronRight className="-ml-1 shrink-0 text-neutral-300" fontSize="small" />
        </Link>
    );
}

export function CardEsqueleto() {
    return (
        <div className="flex w-[68vw] max-w-[250px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
            <div className="aspect-[4/3] w-full animate-pulse bg-neutral-200" />
            <div className="flex flex-col gap-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
                <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-neutral-200" />
            </div>
        </div>
    );
}

export function LinhaEsqueleto() {
    return (
        <div className="flex items-center gap-3 py-4">
            <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-neutral-200" />
        </div>
    );
}
