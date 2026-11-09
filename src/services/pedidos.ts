import type {
    FulfillmentType,
    OrderResponse,
    OrderSummaryResponse,
    PaymentMethod,
    Status3,
} from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas } from "@/src/lib/http";

/** Pedidos do painel do admin. Tudo aqui exige a permissão "Pedidos" (MANAGE_ORDERS). */

export type StatusPedido = Status3;
export type TipoEntrega = FulfillmentType;
export type FormaPagamento = PaymentMethod;

/** Etapas ativas, na ordem das colunas do painel. */
export const ETAPAS_ATIVAS: { status: StatusPedido; titulo: string; curto: string }[] = [
    { status: "PENDING", titulo: "Novos", curto: "Novos" },
    { status: "IN_PREPARATION", titulo: "Em preparo", curto: "Preparo" },
    { status: "READY", titulo: "Prontos", curto: "Prontos" },
    { status: "OUT_FOR_DELIVERY", titulo: "Saiu para entrega", curto: "Entrega" },
];

export const NOME_STATUS: Record<StatusPedido, string> = {
    PENDING: "Novo",
    IN_PREPARATION: "Em preparo",
    READY: "Pronto",
    OUT_FOR_DELIVERY: "Saiu para entrega",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
};

export const NOME_TIPO: Record<TipoEntrega, string> = {
    DELIVERY: "Delivery",
    PICKUP: "Retirada",
    DINE_IN: "No local",
};

export const NOME_PAGAMENTO: Record<FormaPagamento, string> = {
    PIX: "Pix",
    CARD: "Cartão",
    CASH: "Dinheiro",
};

export interface Pedido {
    id: number;
    codigo: string;
    /** Nome do visitante; para cliente cadastrado o backend só manda o id. */
    cliente: string;
    tipo: TipoEntrega;
    status: StatusPedido;
    pagamento: FormaPagamento | null;
    pago: boolean;
    quantidadeItens: number;
    total: number;
    criadoEm: string;
}

function toPedido(p: OrderSummaryResponse): Pedido {
    return {
        id: p.id as number,
        codigo: p.code ?? String(p.id),
        cliente: p.guestName?.trim() || (p.clientId ? `Cliente #${p.clientId}` : "Cliente"),
        tipo: p.fulfillmentType ?? "PICKUP",
        status: p.status ?? "PENDING",
        pagamento: p.paymentMethod ?? null,
        pago: p.paid ?? false,
        quantidadeItens: p.itemCount ?? 0,
        total: p.total ?? 0,
        criadoEm: p.createdAt ?? new Date().toISOString(),
    };
}

async function listarPorStatus(status: StatusPedido): Promise<Pedido[]> {
    const lista = await unwrapTodas((page, size) => api.order.ordersGet(page, size, status));

    return lista.map(toPedido);
}

/** Pedidos em andamento (das 4 etapas ativas). */
export async function listarPedidosAtivos(): Promise<Pedido[]> {
    const porEtapa = await Promise.all(ETAPAS_ATIVAS.map((e) => listarPorStatus(e.status)));

    return porEtapa.flat();
}

/** Concluídos e cancelados, do mais recente para o mais antigo. */
export async function listarHistorico(): Promise<Pedido[]> {
    const [concluidos, cancelados] = await Promise.all([
        listarPorStatus("COMPLETED"),
        listarPorStatus("CANCELLED"),
    ]);

    return [...concluidos, ...cancelados].sort(
        (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );
}

export async function buscarPedido(id: number): Promise<OrderResponse> {
    return unwrap(api.order.ordersIdGet(id));
}

/**
 * Próxima etapa e o texto do botão. O backend só aceita avançar uma etapa por vez;
 * depois de "Pronto", delivery vai para "Saiu para entrega" e os demais são concluídos.
 */
export function proximaEtapa(
    status: StatusPedido,
    tipo: TipoEntrega
): { status: StatusPedido; acao: string } | null {
    switch (status) {
        case "PENDING":
            return { status: "IN_PREPARATION", acao: "Aceitar" };
        case "IN_PREPARATION":
            return { status: "READY", acao: "Marcar pronto" };
        case "READY":
            return tipo === "DELIVERY"
                ? { status: "OUT_FOR_DELIVERY", acao: "Saiu para entrega" }
                : { status: "COMPLETED", acao: tipo === "DINE_IN" ? "Servido" : "Retirado" };
        case "OUT_FOR_DELIVERY":
            return { status: "COMPLETED", acao: "Entregue" };
        default:
            return null;
    }
}

export async function avancarPedido(id: number, status: StatusPedido): Promise<void> {
    await unwrap(api.order.ordersIdStatusPost(id, { status }));
}

export async function cancelarPedido(id: number, motivo: string): Promise<void> {
    await unwrap(api.order.ordersIdCancelPost(id, { reason: motivo.trim() || undefined }));
}

export async function marcarComoPago(id: number): Promise<void> {
    await unwrap(api.order.ordersIdPayPost(id));
}

/** Minutos desde que o pedido entrou. */
export function minutosDesde(iso: string, agora: number): number {
    return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000));
}

/** Limites do destaque de atraso, em minutos. */
export const ATRASO = { atencao: 15, atrasado: 30 };
