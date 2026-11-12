import Link from "next/link";
import { Add } from "@mui/icons-material";

import { formatCurrency, formatDate } from "@/src/lib/format";
import type { ItemCombo, ItemProduto, ItemPromocao } from "@/src/services/cardapio";

import ImagemItem from "./ImagemItem";

// No celular os cards ficam num carrossel com largura fixa, para o próximo "espiar" na borda.
// A partir de md eles viram itens de grade e ocupam a coluna inteira.
const CARD =
    "group flex w-[70vw] max-w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition-transform active:scale-[0.98] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marca md:w-auto md:max-w-none";

/** Botão "+" desenhado sobre a foto: o card inteiro é o link, ele só sinaliza que dá para pedir. */
function MaisNaFoto() {
    return (
        <span
            aria-hidden="true"
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-marca text-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.35)] transition-colors group-hover:bg-marca-escura"
        >
            <Add fontSize="small" />
        </span>
    );
}

export function CardPromocao({ item }: { item: ItemPromocao }) {
    return (
        <Link href={item.href} className={CARD}>
            <div className="relative">
                <ImagemItem src={item.imagem} alt={item.nome} className="aspect-[4/3] w-full" />

                {item.desconto > 0 && (
                    // Selo de oferta, como o adesivo de preço na vitrine da lanchonete.
                    <span className="absolute left-2 top-2 flex h-14 w-14 -rotate-12 flex-col items-center justify-center rounded-full bg-mostarda font-display leading-none text-tinta shadow-[0_4px_10px_-2px_rgba(0,0,0,0.3)]">
                        <span className="text-lg font-extrabold">-{item.desconto}%</span>
                    </span>
                )}

                <MaisNaFoto />
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="line-clamp-1 font-display text-base font-bold">{item.nome}</h3>

                {item.descricao && (
                    <p className="line-clamp-2 text-xs leading-snug text-tinta-suave">{item.descricao}</p>
                )}

                <div className="mt-auto pt-2">
                    {item.variosPrecos && (
                        <span className="block text-[11px] text-tinta-suave">a partir de</span>
                    )}

                    <div className="flex items-baseline gap-2">
                        <span className="font-display text-xl font-extrabold text-marca">
                            {formatCurrency(item.precoPromocional)}
                        </span>

                        <span className="text-xs text-tinta-suave line-through">
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

                <span className="absolute left-2 top-2 rounded-lg bg-tinta px-2.5 py-1 font-display text-xs font-bold text-white">
                    Combo
                </span>

                <MaisNaFoto />
            </div>

            <div className="flex flex-1 flex-col gap-1 p-3">
                <h3 className="line-clamp-1 font-display text-base font-bold">{item.nome}</h3>

                {item.descricao && (
                    <p className="line-clamp-2 text-xs leading-snug text-tinta-suave">{item.descricao}</p>
                )}

                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <span className="font-display text-xl font-extrabold">{formatCurrency(item.preco)}</span>

                    {item.validoAte && (
                        <span className="text-[11px] text-tinta-suave">
                            até {formatDate(item.validoAte).slice(0, 5)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

/** Produto do cardápio: linha com texto à esquerda e foto à direita, em qualquer tela. */
export function LinhaProduto({ item }: { item: ItemProduto }) {
    return (
        <Link
            href={item.href}
            className="group flex h-full items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition-transform active:scale-[0.99] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marca"
        >
            <div className="flex min-w-0 flex-1 flex-col gap-1 self-stretch py-1">
                <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{item.nome}</h3>

                {item.descricao && (
                    <p className="line-clamp-2 text-sm leading-snug text-tinta-suave">{item.descricao}</p>
                )}

                <p className="mt-auto pt-1">
                    {item.variosPrecos && <span className="text-xs text-tinta-suave">a partir de </span>}
                    <span className="font-display text-lg font-extrabold">{formatCurrency(item.precoMinimo)}</span>
                </p>
            </div>

            <div className="relative shrink-0">
                <ImagemItem src={item.imagem} alt={item.nome} className="h-28 w-28 rounded-xl" />
                <MaisNaFoto />
            </div>
        </Link>
    );
}

export function CardEsqueleto() {
    return (
        <div className="flex w-[70vw] max-w-[260px] shrink-0 flex-col overflow-hidden rounded-2xl bg-white md:w-auto md:max-w-none">
            <div className="aspect-[4/3] w-full animate-pulse bg-black/10" />
            <div className="flex flex-col gap-2 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-black/10" />
                <div className="h-3 w-full animate-pulse rounded bg-black/5" />
                <div className="mt-2 h-5 w-1/3 animate-pulse rounded bg-black/10" />
            </div>
        </div>
    );
}

export function LinhaEsqueleto() {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
            <div className="flex flex-1 flex-col gap-2">
                <div className="h-4 w-1/2 animate-pulse rounded bg-black/10" />
                <div className="h-3 w-full animate-pulse rounded bg-black/5" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-black/10" />
            </div>
            <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-black/10" />
        </div>
    );
}
