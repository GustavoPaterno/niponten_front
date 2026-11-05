import { Add, Remove } from "@mui/icons-material";

import { formatCurrency } from "@/src/lib/format";

interface ResumoCarrinhoProps {
    subtotal: number;
    total: number;
    conferindo: boolean;
    aviso: string | null;
}

/**
 * Subtotal, pontos (ainda não existem: ficam visíveis, mas desabilitados), total e o botão
 * de pedir (desabilitado até o checkout existir).
 */
export default function ResumoCarrinho({ subtotal, total, conferindo, aviso }: ResumoCarrinhoProps) {
    return (
        <section aria-label="Resumo do pedido" className="flex flex-col gap-3">
            <h2 className="hidden text-lg font-bold lg:block">Resumo</h2>

            <dl className="flex flex-col gap-2.5 text-neutral-700">
                <div className="flex items-center justify-between">
                    <dt>Subtotal</dt>
                    <dd className={`tabular-nums ${conferindo ? "text-neutral-400" : ""}`}>
                        {formatCurrency(subtotal)}
                    </dd>
                </div>

                <div className="flex items-center justify-between gap-3 text-neutral-400" aria-disabled="true">
                    <dt className="flex items-center gap-2">
                        Pontos
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium">
                            Em breve
                        </span>
                    </dt>
                    <dd className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <button type="button" disabled aria-label="Diminuir pontos" className="flex h-7 w-7 items-center justify-center rounded-full opacity-50">
                                <Remove sx={{ fontSize: 16 }} />
                            </button>
                            <span className="w-4 text-center tabular-nums">0</span>
                            <button type="button" disabled aria-label="Aumentar pontos" className="flex h-7 w-7 items-center justify-center rounded-full opacity-50">
                                <Add sx={{ fontSize: 16 }} />
                            </button>
                        </span>
                        <span className="tabular-nums">{formatCurrency(0)}</span>
                    </dd>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 pt-2.5 text-lg font-bold text-neutral-900">
                    <dt>Total</dt>
                    <dd className={`tabular-nums ${conferindo ? "text-neutral-400" : ""}`}>
                        {formatCurrency(total)}
                    </dd>
                </div>
            </dl>

            {aviso && <p className="text-xs text-neutral-500">{aviso}</p>}

            <button
                type="button"
                disabled
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-(--primary) font-semibold text-white opacity-60"
            >
                Pedir
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium">Em breve</span>
            </button>
        </section>
    );
}
