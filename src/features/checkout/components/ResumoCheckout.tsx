import Link from "next/link";
import { Alert, CircularProgress } from "@mui/material";

import type { ItemCarrinho } from "@/src/lib/carrinho";
import { formatCurrency } from "@/src/lib/format";
import type { CotacaoPedido } from "@/src/services/cotacao";
import { formatarKm } from "@/src/services/entrega";

interface ResumoCheckoutProps {
    itens: ItemCarrinho[];
    /** Valores do backend para a escolha atual. `null` = calculando (ou falhou). */
    cotacao: CotacaoPedido | null;
    erroCotacao: string | null;
    erro: string | null;
    pontos: number;
    /** Delivery ainda sem endereço: a taxa só aparece depois dele. */
    taxaPendente: boolean;
    /** Cliente logado: pode usar e ganhar pontos. */
    cliente: boolean;
    enviando: boolean;
    onTentarDeNovo: () => void;
    onConfirmar: () => void;
}

export default function ResumoCheckout({
    itens,
    cotacao,
    erroCotacao,
    erro,
    pontos,
    taxaPendente,
    cliente,
    enviando,
    onTentarDeNovo,
    onConfirmar,
}: ResumoCheckoutProps) {
    const calculando = !cotacao && !erroCotacao;

    return (
        <section
            aria-label="Resumo do pedido"
            className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:p-6 lg:sticky lg:top-24"
        >
            <h2 className="font-display text-lg font-bold">Resumo</h2>

            <ul className="flex flex-col gap-1.5 text-sm">
                {itens.map((item, indice) => (
                    <li key={item.chave} className="flex justify-between gap-3">
                        <span className="min-w-0 break-words">
                            {item.quantidade}x {item.nome}
                        </span>
                        <span className="shrink-0 tabular-nums text-tinta-suave">
                            {cotacao ? formatCurrency(cotacao.totaisDosItens[indice]) : "…"}
                        </span>
                    </li>
                ))}
            </ul>

            {cotacao && (
                <dl className="flex flex-col gap-2 border-t border-black/10 pt-3 tabular-nums" aria-live="polite">
                    <div className="flex justify-between">
                        <dt>Subtotal</dt>
                        <dd>{formatCurrency(cotacao.subtotal)}</dd>
                    </div>

                    {taxaPendente ? (
                        <div className="flex justify-between gap-3 text-tinta-suave">
                            <dt>Taxa de entrega</dt>
                            <dd className="text-right text-sm">informe o endereço</dd>
                        </div>
                    ) : (
                        (cotacao.taxaEntrega > 0 || cotacao.distanciaKm !== null) && (
                            <div className="flex justify-between gap-3">
                                <dt>
                                    Taxa de entrega
                                    {cotacao.distanciaKm !== null && (
                                        <span className="text-sm text-tinta-suave">
                                            {" "}
                                            ({formatarKm(cotacao.distanciaKm)})
                                        </span>
                                    )}
                                </dt>
                                <dd className="shrink-0">
                                    {cotacao.taxaEntrega > 0 ? formatCurrency(cotacao.taxaEntrega) : "Grátis"}
                                </dd>
                            </div>
                        )
                    )}

                    {cotacao.desconto > 0 && (
                        <div className="flex justify-between gap-3 text-marca">
                            <dt>
                                Desconto ({pontos.toLocaleString("pt-BR")} {pontos === 1 ? "ponto" : "pontos"})
                            </dt>
                            <dd className="shrink-0">− {formatCurrency(cotacao.desconto)}</dd>
                        </div>
                    )}

                    <div className="flex justify-between border-t border-black/10 pt-2 font-display text-xl font-extrabold">
                        <dt>Total</dt>
                        <dd>{formatCurrency(cotacao.total)}</dd>
                    </div>
                </dl>
            )}

            {calculando && (
                <p className="flex items-center gap-2 border-t border-black/10 pt-3 text-sm text-tinta-suave">
                    <CircularProgress size={16} /> Calculando o total...
                </p>
            )}

            {cliente && (
                <Link href="/carrinho" className="text-sm font-semibold text-marca">
                    {pontos > 0 ? "Alterar pontos no carrinho" : "Usar pontos no carrinho"}
                </Link>
            )}

            {cotacao && cliente && cotacao.pontosAGanhar > 0 && (
                <p className="text-xs text-tinta-suave">
                    Este pedido rende {cotacao.pontosAGanhar.toLocaleString("pt-BR")}{" "}
                    {cotacao.pontosAGanhar === 1 ? "ponto" : "pontos"} para as próximas compras.
                </p>
            )}

            {erroCotacao && (
                <Alert severity="error">
                    {erroCotacao}{" "}
                    <button type="button" onClick={onTentarDeNovo} className="cursor-pointer font-bold underline">
                        Tentar novamente
                    </button>{" "}
                    ou{" "}
                    <Link href="/carrinho" className="font-bold underline">
                        revise o carrinho
                    </Link>
                    .
                </Alert>
            )}

            {erro && <Alert severity="error">{erro}</Alert>}

            <button
                type="button"
                onClick={onConfirmar}
                disabled={enviando || !cotacao}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-marca px-5 font-display font-bold text-white transition hover:bg-marca-escura active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-60"
            >
                {enviando ? (
                    <>
                        <CircularProgress size={18} sx={{ color: "#fff" }} />
                        Enviando pedido...
                    </>
                ) : (
                    <>
                        <span>Confirmar pedido</span>
                        {cotacao && (
                            <span className="ml-auto font-extrabold tabular-nums">{formatCurrency(cotacao.total)}</span>
                        )}
                    </>
                )}
            </button>
        </section>
    );
}
