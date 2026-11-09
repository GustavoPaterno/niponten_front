import Link from "next/link";
import { DeleteOutlined, ErrorOutlined } from "@mui/icons-material";

import Contador from "@/src/features/produto/components/Contador";
import ImagemItem from "@/src/features/menu/components/ImagemItem";
import {
    alterarQuantidade,
    removerDoCarrinho,
    totalDoItem,
    type ItemCarrinho,
} from "@/src/lib/carrinho";
import { formatCurrency } from "@/src/lib/format";
import type { CotacaoItem } from "@/src/services/cotacao";

const MAXIMO_POR_ITEM = 20;

function hrefDoItem(item: ItemCarrinho): string {
    if (item.tipo === "COMBO") {
        return `/menu/produto/${item.comboId}?tipo=combo`;
    }

    return item.promocaoId
        ? `/menu/produto/${item.productId}?promocao=${item.promocaoId}`
        : `/menu/produto/${item.productId}`;
}

function minusculaInicial(texto: string): string {
    return texto.charAt(0).toLowerCase() + texto.slice(1);
}

interface LinhaCarrinhoProps {
    item: ItemCarrinho;
    /** Preço oficial do backend; sem ele, usa o preço guardado no carrinho. */
    cotacao: CotacaoItem | undefined;
    problemas: string[] | undefined;
}

export default function LinhaCarrinho({ item, cotacao, problemas }: LinhaCarrinhoProps) {
    const href = hrefDoItem(item);
    // Preço oficial por unidade × quantidade atual: reage na hora ao − / +, antes da nova cotação.
    const total = cotacao ? cotacao.precoUnitario * item.quantidade : totalDoItem(item);
    const original = cotacao?.precoOriginal ? cotacao.precoOriginal * item.quantidade : null;
    const comProblema = Boolean(problemas?.length);

    return (
        <li className={`flex gap-3 py-4 md:gap-4 md:py-5 ${comProblema ? "opacity-95" : ""}`}>
            <Link href={href} className="shrink-0" aria-label={`Ver ${item.nome}`}>
                <ImagemItem
                    src={item.imagem}
                    alt={item.nome}
                    className="h-20 w-20 rounded-xl md:h-24 md:w-24"
                />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                    <Link href={href} className="min-w-0 font-semibold leading-snug hover:underline">
                        {item.tipo === "COMBO" && (
                            <span className="mr-1.5 rounded bg-neutral-900 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-white">
                                Combo
                            </span>
                        )}
                        {item.nome}
                    </Link>

                    <div className="shrink-0 text-right">
                        {original && original > total && (
                            <span className="block text-xs text-neutral-400 line-through">
                                {formatCurrency(original)}
                            </span>
                        )}
                        {/* Item recusado pelo backend não entra no total: preço apagado e riscado. */}
                        <span
                            className={`font-semibold tabular-nums ${
                                comProblema
                                    ? "text-neutral-400 line-through"
                                    : original
                                      ? "text-(--primary)"
                                      : ""
                            }`}
                        >
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                <dl className="flex flex-col gap-0.5 text-sm text-neutral-500">
                    {item.tipo === "PRODUCT" && item.tamanho && (
                        <div>
                            <dt className="sr-only">Tamanho</dt>
                            <dd>{item.tamanho}</dd>
                        </div>
                    )}

                    {item.tipo === "PRODUCT" && item.removidos.length > 0 && (
                        <div>
                            <dt className="sr-only">Sem</dt>
                            <dd>Sem {item.removidos.map((r) => minusculaInicial(r.nome)).join(", ")}</dd>
                        </div>
                    )}

                    {item.tipo === "PRODUCT" && item.adicionais.length > 0 && (
                        <div>
                            <dt className="inline font-medium text-(--primary)">Adicionais: </dt>
                            <dd className="inline">
                                {item.adicionais
                                    .map((a) =>
                                        a.quantidade > 1
                                            ? `${minusculaInicial(a.nome)} (${a.quantidade}x)`
                                            : minusculaInicial(a.nome)
                                    )
                                    .join(", ")}
                            </dd>
                        </div>
                    )}

                    {item.observacao && (
                        <div>
                            <dt className="sr-only">Observação</dt>
                            <dd className="italic">“{item.observacao}”</dd>
                        </div>
                    )}
                </dl>

                {comProblema && (
                    <ul className="mt-1 flex flex-col gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                        {problemas!.map((problema, i) => (
                            <li key={i} className="flex gap-1.5">
                                <ErrorOutlined sx={{ fontSize: 16 }} className="mt-0.5 shrink-0" />
                                <span>{problema}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-1 flex items-center justify-end gap-2">
                    <Contador
                        valor={item.quantidade}
                        min={1}
                        max={MAXIMO_POR_ITEM}
                        onChange={(q) => alterarQuantidade(item.chave, q)}
                        rotulo={`quantidade de ${item.nome}`}
                    />

                    <button
                        type="button"
                        onClick={() => removerDoCarrinho(item.chave)}
                        aria-label={`Remover ${item.nome}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-(--primary) transition hover:bg-red-50 active:bg-red-100"
                    >
                        <DeleteOutlined fontSize="small" />
                    </button>
                </div>
            </div>
        </li>
    );
}
