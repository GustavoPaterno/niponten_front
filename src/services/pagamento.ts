import type { PaymentChannel, PaymentMethod, PaymentResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap } from "@/src/lib/http";

/**
 * Pagamento do checkout e do pedido.
 *
 * - Presencial (`IN_PERSON`): o pedido nasce em PENDING e a equipe marca como pago.
 * - Online (`ONLINE`): o pedido nasce em AWAITING_PAYMENT (a cozinha não vê) e só sai de lá com o
 *   pagamento aprovado pelo Mercado Pago. A cobrança é feita depois de criar o pedido, em
 *   "Meus pedidos" (ver `PagamentoOnline`), para o cliente poder tentar de novo sem refazer o
 *   pedido. O backend expira o pedido sem pagamento depois de 30 minutos.
 *
 * O cartão online usa o Card Payment Brick do Mercado Pago, que precisa da public key em
 * MERCADOPAGO_PUBLIC_KEY (chega ao navegador por `useConfigPublica`). Sem ela, a opção não aparece.
 */

export type FormaEscolhida = "PIX_ONLINE" | "CARTAO_ONLINE" | "DINHEIRO" | "DEBITO" | "CREDITO" | "PIX";

export interface OpcaoPagamento {
    valor: FormaEscolhida;
    label: string;
    descricao: string;
    metodo: PaymentMethod;
    canal: PaymentChannel;
    /** Vai nas observações do pedido, quando `metodo` sozinho não diz tudo. */
    observacao?: string;
}

const ONLINE: OpcaoPagamento[] = [
    {
        valor: "PIX_ONLINE",
        label: "Pix agora",
        descricao: "QR code ou copia e cola",
        metodo: "PIX",
        canal: "ONLINE",
    },
    {
        valor: "CARTAO_ONLINE",
        label: "Cartão de crédito",
        descricao: "Pague agora, à vista",
        metodo: "CARD",
        canal: "ONLINE",
    },
];

const PRESENCIAL: OpcaoPagamento[] = [
    {
        valor: "DINHEIRO",
        label: "Dinheiro",
        descricao: "Em espécie",
        metodo: "CASH",
        canal: "IN_PERSON",
    },
    // O backend só tem "CARD": débito e crédito vão como cartão, com o tipo nas observações.
    {
        valor: "DEBITO",
        label: "Débito",
        descricao: "Cartão na maquininha",
        metodo: "CARD",
        canal: "IN_PERSON",
        observacao: "Pagamento: cartão de débito",
    },
    {
        valor: "CREDITO",
        label: "Crédito",
        descricao: "Cartão na maquininha",
        metodo: "CARD",
        canal: "IN_PERSON",
        observacao: "Pagamento: cartão de crédito",
    },
    {
        valor: "PIX",
        label: "Pix",
        descricao: "Na hora de receber",
        metodo: "PIX",
        canal: "IN_PERSON",
    },
];

/** Pagar agora: o cartão só aparece com a public key do Mercado Pago configurada. */
export function opcoesOnline(publicKeyMercadoPago: string): OpcaoPagamento[] {
    return ONLINE.filter((o) => o.metodo !== "CARD" || publicKeyMercadoPago !== "");
}

/** Pagar na entrega, na retirada ou no balcão. */
export const OPCOES_PRESENCIAIS = PRESENCIAL;

export function opcaoDePagamento(forma: FormaEscolhida): OpcaoPagamento {
    return [...ONLINE, ...PRESENCIAL].find((o) => o.valor === forma) as OpcaoPagamento;
}

export interface PedidoAPagar {
    id: number;
    codigo: string;
    /** Valor final calculado pelo backend, já com o desconto dos pontos. */
    total: number;
    /** Código de acompanhamento: só vem para visitante, e é o que autoriza ele a pagar. */
    token: string | null;
    canal: PaymentChannel;
}

/* ---------- Pagamento online ---------- */

export type StatusPagamento = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | "REFUNDED" | "CHARGED_BACK";

export interface PagamentoOnline {
    id: number;
    metodo: "PIX" | "CARD";
    status: StatusPagamento;
    detalhe: string | null;
    valor: number;
    /** Pix: código copia e cola. */
    pixCopiaECola: string | null;
    /** Pix: imagem PNG do QR code, em base64. */
    pixQrCodeBase64: string | null;
    expiraEm: string | null;
    aprovadoEm: string | null;
    criadoEm: string;
}

function dePagamento(p: PaymentResponse): PagamentoOnline {
    return {
        id: p.id as number,
        metodo: (p.method ?? "PIX") as "PIX" | "CARD",
        status: (p.status ?? "PENDING") as StatusPagamento,
        detalhe: p.statusDetail ?? null,
        valor: p.amount ?? 0,
        pixCopiaECola: p.pixQrCode ?? null,
        pixQrCodeBase64: p.pixQrCodeBase64 ?? null,
        expiraEm: p.expiresAt ?? null,
        aprovadoEm: p.approvedAt ?? null,
        criadoEm: p.createdAt ?? "",
    };
}

/** Tentativas de pagamento do pedido, da mais antiga para a mais nova. */
export async function listarPagamentos(pedidoId: number, token: string | null): Promise<PagamentoOnline[]> {
    const lista = await unwrap(api.order.ordersIdPaymentsGet(pedidoId, token ?? undefined));

    return (lista ?? []).map(dePagamento);
}

/** Cria a cobrança Pix (QR code válido por 30 minutos). */
export async function gerarPix(pedidoId: number, token: string | null): Promise<PagamentoOnline> {
    return dePagamento(await unwrap(api.order.ordersIdPaymentsPost(pedidoId, { method: "PIX" }, token ?? undefined)));
}

/** O que o Card Payment Brick devolve depois de tokenizar o cartão. */
export interface DadosCartao {
    token: string;
    bandeira: string;
    email?: string;
    documento?: { tipo: string; numero: string };
}

/** Cobra o cartão tokenizado pelo Brick. O resultado já vem na resposta. */
export async function pagarComCartao(
    pedidoId: number,
    token: string | null,
    cartao: DadosCartao
): Promise<PagamentoOnline> {
    return dePagamento(
        await unwrap(
            api.order.ordersIdPaymentsPost(
                pedidoId,
                {
                    method: "CARD",
                    card: {
                        token: cartao.token,
                        paymentMethodId: cartao.bandeira,
                        payerEmail: cartao.email || undefined,
                        identification: cartao.documento?.numero
                            ? { type: cartao.documento.tipo, number: cartao.documento.numero.replace(/\D/g, "") }
                            : undefined,
                    },
                },
                token ?? undefined
            )
        )
    );
}

/** A tentativa mais recente, que é a que conta para o cliente. */
export function pagamentoAtual(lista: PagamentoOnline[]): PagamentoOnline | null {
    return lista.length ? lista[lista.length - 1] : null;
}

/** Pix aberto e ainda no prazo: dá para pagar com o QR que já existe. */
export function pixAberto(p: PagamentoOnline | null, agora = Date.now()): boolean {
    return (
        !!p &&
        p.metodo === "PIX" &&
        p.status === "PENDING" &&
        !!p.pixCopiaECola &&
        (!p.expiraEm || new Date(p.expiraEm).getTime() > agora)
    );
}

// Motivos de recusa do cartão que o Mercado Pago devolve em status_detail.
const MOTIVOS_RECUSA: [RegExp, string][] = [
    [/insufficient_amount/, "Saldo ou limite insuficiente."],
    [/bad_filled_security_code|invalid_security_code/, "Código de segurança inválido."],
    [/bad_filled_date|expired_card/, "Data de validade inválida."],
    [/bad_filled|invalid_card/, "Confira os dados do cartão."],
    [/call_for_authorize/, "O banco pediu autorização: ligue para ele e tente de novo."],
    [/card_disabled/, "Cartão desativado. Ligue para o banco ou use outro cartão."],
    [/duplicated_payment/, "Pagamento repetido. Use outro cartão se precisar pagar de novo."],
    [/high_risk|blacklist/, "Pagamento recusado pela análise de segurança. Tente outro cartão ou o Pix."],
    [/max_attempts/, "Limite de tentativas atingido. Use outro cartão."],
];

/** Mensagem para o cliente de uma tentativa recusada. */
export function motivoDaRecusa(detalhe: string | null): string {
    const achado = MOTIVOS_RECUSA.find(([padrao]) => detalhe && padrao.test(detalhe));

    return achado ? achado[1] : "O cartão foi recusado. Tente outro cartão ou pague com Pix.";
}

export const NOME_STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
    PENDING: "Aguardando pagamento",
    APPROVED: "Pago",
    REJECTED: "Recusado",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
    REFUNDED: "Estornado",
    CHARGED_BACK: "Contestado",
};
