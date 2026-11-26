import { formatCurrency } from "@/src/lib/format";

interface ResumoCarrinhoProps {
    subtotal: number;
    /** Já com o desconto dos pontos, quando houver. */
    total: number;
    /** Desconto dos pontos, em reais. 0 = sem desconto. */
    desconto: number;
    pontosUsados: number;
    /** Linha de escolha dos pontos. */
    linhaDePontos: React.ReactNode;
    conferindo: boolean;
    aviso: string | null;
    /** Pode pedir: carrinho conferido e sem itens recusados. */
    podePedir: boolean;
    onPedir: () => void;
}

/**
 * Subtotal, pontos, total e o botão que leva ao checkout (entrega e forma de pagamento).
 */
export default function ResumoCarrinho({
    subtotal,
    total,
    desconto,
    pontosUsados,
    linhaDePontos,
    conferindo,
    aviso,
    podePedir,
    onPedir,
}: ResumoCarrinhoProps) {
    return (
        <section aria-label="Resumo do pedido" className="flex flex-col gap-3">
            <h2 className="font-display hidden text-lg font-bold lg:block">Resumo</h2>

            <dl className="flex flex-col gap-2.5 text-tinta">
                <div className="flex items-center justify-between">
                    <dt>Subtotal</dt>
                    <dd className={`tabular-nums ${conferindo ? "text-tinta-suave/70" : ""}`}>
                        {formatCurrency(subtotal)}
                    </dd>
                </div>

            </dl>

            {linhaDePontos}

            <dl className="flex flex-col gap-2.5 text-tinta">
                {desconto > 0 && (
                    <div className="flex items-center justify-between gap-3 text-marca">
                        <dt>
                            Desconto ({pontosUsados.toLocaleString("pt-BR")}{" "}
                            {pontosUsados === 1 ? "ponto" : "pontos"})
                        </dt>
                        <dd className="shrink-0 tabular-nums">− {formatCurrency(desconto)}</dd>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-black/10 pt-2.5 font-display text-xl font-extrabold text-tinta">
                    <dt>Total</dt>
                    <dd className={`tabular-nums ${conferindo ? "text-tinta-suave/70" : ""}`}>
                        {formatCurrency(total)}
                    </dd>
                </div>
            </dl>

            {aviso && <p className="text-xs text-tinta-suave">{aviso}</p>}

            <button
                type="button"
                onClick={onPedir}
                disabled={!podePedir}
                className="flex h-12 w-full items-center justify-between gap-2 rounded-xl bg-marca px-5 font-display font-bold text-white transition hover:bg-marca-escura active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-50"
            >
                <span>Ir para o pagamento</span>
                <span className="font-extrabold tabular-nums">{formatCurrency(total)}</span>
            </button>
        </section>
    );
}
