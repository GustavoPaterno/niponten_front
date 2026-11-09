"use client";

import {
    AccessTimeOutlined,
    DeliveryDiningOutlined,
    RestaurantOutlined,
    StorefrontOutlined,
} from "@mui/icons-material";

import { formatCurrency } from "@/src/lib/format";
import {
    ATRASO,
    NOME_PAGAMENTO,
    NOME_TIPO,
    minutosDesde,
    proximaEtapa,
    type Pedido,
    type TipoEntrega,
} from "@/src/services/pedidos";

export const ICONE_TIPO: Record<TipoEntrega, typeof DeliveryDiningOutlined> = {
    DELIVERY: DeliveryDiningOutlined,
    PICKUP: StorefrontOutlined,
    DINE_IN: RestaurantOutlined,
};

/** "3 min", "1h 05" */
export function formatarTempo(minutos: number): string {
    if (minutos < 60) {
        return `${minutos} min`;
    }

    return `${Math.floor(minutos / 60)}h ${String(minutos % 60).padStart(2, "0")}`;
}

export function corDoTempo(minutos: number): string {
    if (minutos >= ATRASO.atrasado) {
        return "bg-red-100 text-red-700";
    }

    if (minutos >= ATRASO.atencao) {
        return "bg-amber-100 text-amber-800";
    }

    return "bg-neutral-100 text-neutral-600";
}

interface CardPedidoProps {
    pedido: Pedido;
    agora: number;
    novo: boolean;
    avancando: boolean;
    onAbrir: () => void;
    onAvancar: () => void;
}

export default function CardPedido({
    pedido,
    agora,
    novo,
    avancando,
    onAbrir,
    onAvancar,
}: CardPedidoProps) {
    const minutos = minutosDesde(pedido.criadoEm, agora);
    const proxima = proximaEtapa(pedido.status, pedido.tipo);
    const IconeTipo = ICONE_TIPO[pedido.tipo];

    return (
        <article
            className={`relative flex flex-col gap-3 rounded-xl bg-white p-3.5 shadow-sm ring-1 transition ${
                novo ? "ring-2 ring-(--primary) shadow-red-200" : "ring-black/5 hover:ring-black/15"
            }`}
        >
            {/* A área de cima abre os detalhes; o botão de baixo avança a etapa. */}
            <button
                type="button"
                onClick={onAbrir}
                className="flex flex-col gap-2 text-left"
                aria-label={`Ver detalhes do pedido ${pedido.codigo}`}
            >
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold tracking-tight">#{pedido.codigo}</span>
                        {novo && (
                            <span className="animate-pulse rounded-full bg-(--primary) px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                Novo
                            </span>
                        )}
                    </span>

                    <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${corDoTempo(minutos)}`}
                        title={`Recebido há ${formatarTempo(minutos)}`}
                    >
                        <AccessTimeOutlined sx={{ fontSize: 14 }} />
                        {formatarTempo(minutos)}
                    </span>
                </div>

                <p className="truncate font-medium text-neutral-800">{pedido.cliente}</p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                        <IconeTipo sx={{ fontSize: 18 }} />
                        {NOME_TIPO[pedido.tipo]}
                    </span>
                    <span>
                        {pedido.quantidadeItens} {pedido.quantidadeItens === 1 ? "item" : "itens"}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className="font-bold tabular-nums">{formatCurrency(pedido.total)}</span>
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            pedido.pago ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-800"
                        }`}
                    >
                        {pedido.pagamento ? NOME_PAGAMENTO[pedido.pagamento] : "Pagamento"} ·{" "}
                        {pedido.pago ? "pago" : "a receber"}
                    </span>
                </div>
            </button>

            {proxima && (
                <button
                    type="button"
                    onClick={onAvancar}
                    disabled={avancando}
                    className="flex h-10 items-center justify-center gap-1 rounded-lg bg-(--primary) text-sm font-semibold text-white transition hover:bg-[#d92628] active:scale-[0.98] disabled:opacity-60"
                >
                    {avancando ? "Atualizando..." : `${proxima.acao} →`}
                </button>
            )}
        </article>
    );
}
