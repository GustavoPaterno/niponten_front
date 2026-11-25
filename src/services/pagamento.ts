import type { PaymentChannel, PaymentMethod } from "@joao.sumi/nippon-ten";

/**
 * Pagamento do checkout.
 *
 * ┌─ PARA QUEM FOR CONECTAR A API DE PAGAMENTO ─────────────────────────────────────────────┐
 * │ Tudo o que muda está neste arquivo.                                                     │
 * │                                                                                         │
 * │ 1. Em OPCOES_PAGAMENTO, crie as opções online (canal "ONLINE"). O backend só aceita     │
 * │    PIX e CARD online; dinheiro é sempre "IN_PERSON", assim como pedido lançado pela     │
 * │    equipe.                                                                              │
 * │ 2. Com "ONLINE", o pedido nasce em AWAITING_PAYMENT (a cozinha não vê).                 │
 * │ 3. Em processarPagamento, cobre o pedido. O backend já expõe:                           │
 * │      api.order.ordersIdPaymentsPost(pedido.id, { method, card }, pedido.token)          │
 * │      api.order.ordersIdPaymentsGet(pedido.id, pedido.token)                             │
 * │    (detalhes em docs/payments.md do backend).                                           │
 * │ 4. O checkout hoje limpa o carrinho e vai para "Meus pedidos" depois dessa função.      │
 * │    Se precisar mostrar QR code ou formulário de cartão, mude o fim de `confirmar` em    │
 * │    features/checkout/CheckoutBuild.tsx.                                                 │
 * └─────────────────────────────────────────────────────────────────────────────────────────┘
 */

export type FormaEscolhida = "DINHEIRO" | "DEBITO" | "CREDITO" | "PIX";

export interface OpcaoPagamento {
    valor: FormaEscolhida;
    label: string;
    descricao: string;
    metodo: PaymentMethod;
    canal: PaymentChannel;
    /** Vai nas observações do pedido, quando `metodo` sozinho não diz tudo. */
    observacao?: string;
}

export const OPCOES_PAGAMENTO: OpcaoPagamento[] = [
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

export function opcaoDePagamento(forma: FormaEscolhida): OpcaoPagamento {
    return OPCOES_PAGAMENTO.find((o) => o.valor === forma) as OpcaoPagamento;
}

export interface PedidoAPagar {
    id: number;
    codigo: string;
    /** Valor final calculado pelo backend, já com o desconto dos pontos. */
    total: number;
    /** Código de acompanhamento: só vem para visitante, e é o que autoriza ele a pagar. */
    token: string | null;
}

/**
 * Chamada logo depois que o pedido é criado.
 *
 * Presencial (tudo o que existe hoje): não há o que cobrar agora.
 */
export async function processarPagamento(pedido: PedidoAPagar, forma: FormaEscolhida): Promise<void> {
    if (opcaoDePagamento(forma).canal === "IN_PERSON") {
        return;
    }

    // PONTO DE INTEGRAÇÃO: troque este erro pela chamada à API de pagamento.
    throw new Error(`O pagamento online do pedido ${pedido.codigo} ainda não foi conectado.`);
}
