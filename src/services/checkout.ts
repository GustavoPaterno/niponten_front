import type {
    FulfillmentType,
    OrderResponse,
    OrderSummaryResponse,
    Status3,
} from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import type { Me } from "@/src/lib/auth";
import { paraPedido, type ItemCarrinho } from "@/src/lib/carrinho";
import { unwrap, unwrapTodas } from "@/src/lib/http";
import { guardarPedidoLocal, lerPedidosLocais } from "@/src/lib/pedidosLocais";

/** Finalização do pedido pelo cliente e a lista "Meus pedidos". */

export type TipoEntregaCliente = FulfillmentType;

export const TIPOS_ENTREGA: { valor: TipoEntregaCliente; label: string; descricao: string }[] = [
    { valor: "DELIVERY", label: "Delivery", descricao: "Entregamos no seu endereço" },
    { valor: "PICKUP", label: "Retirada", descricao: "Você busca no balcão" },
    { valor: "DINE_IN", label: "No local", descricao: "Para comer aqui" },
];

export interface EnderecoInput {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    referencia: string;
}

export interface EnderecoSalvo {
    id: number;
    resumo: string;
    detalhe: string;
}

/**
 * O backend não tem "ponto de referência": ele vai junto do complemento, que é o que aparece no
 * endereço do pedido no painel ("Apto 2 · Ref.: ao lado da padaria").
 */
function complementoComReferencia(e: EnderecoInput): string | undefined {
    const partes = [
        e.complemento.trim(),
        e.referencia.trim() ? `Ref.: ${e.referencia.trim()}` : "",
    ].filter(Boolean);

    return partes.length ? partes.join(" · ") : undefined;
}

function paraEnderecoRequest(e: EnderecoInput) {
    return {
        cep: e.cep.replace(/\D/g, ""),
        streetAddress: e.rua.trim(),
        number: e.numero.trim(),
        complement: complementoComReferencia(e),
    };
}

export async function listarEnderecos(userId: number): Promise<EnderecoSalvo[]> {
    const lista = await unwrap(api.user.usersUserIdAddressesGet(userId));

    return (lista ?? []).map((e) => ({
        id: e.id as number,
        resumo: [e.streetAddress, e.number].filter(Boolean).join(", "),
        detalhe: [e.complement, e.cep ? `CEP ${e.cep}` : ""].filter(Boolean).join(" · "),
    }));
}

export interface DadosFinalizacao {
    tipo: TipoEntregaCliente;
    /** Visitante (e funcionário pedindo pelo balcão): nome e telefone. */
    nome: string;
    telefone: string;
    /** Cliente logado: endereço salvo escolhido. */
    enderecoId: number | null;
    /** Endereço novo (visitante sempre; cliente quando cadastra um). */
    endereco: EnderecoInput | null;
}

export interface PedidoCriado {
    id: number;
    codigo: string;
}

/**
 * Cria o pedido. Regras do backend:
 * - visitante: nome e telefone obrigatórios; endereço digitado no delivery;
 * - cliente: sem nome/telefone; no delivery só aceita endereço salvo (addressId), então um
 *   endereço novo é salvo na conta antes;
 * - funcionário (com permissão Pedidos): pede como visitante, pelo balcão.
 * O pagamento ainda não existe na tela: vai "Dinheiro" (paga na entrega/balcão).
 */
export async function criarPedido(
    itens: ItemCarrinho[],
    dados: DadosFinalizacao,
    me: Me | null
): Promise<PedidoCriado> {
    const cliente = me?.type === "CLIENT";
    const delivery = dados.tipo === "DELIVERY";

    let addressId: number | undefined;

    if (cliente && delivery) {
        if (dados.enderecoId) {
            addressId = dados.enderecoId;
        } else if (dados.endereco) {
            const salvo = await unwrap(
                api.user.usersUserIdAddressesPost(me.userId, paraEnderecoRequest(dados.endereco))
            );
            addressId = (salvo as { id?: number }).id;
        }
    }

    const resposta = await unwrap(
        api.order.ordersPost({
            items: itens.map(paraPedido),
            fulfillmentType: dados.tipo,
            paymentMethod: "CASH",
            addressId,
            address: !cliente && delivery && dados.endereco ? paraEnderecoRequest(dados.endereco) : undefined,
            guestName: cliente ? undefined : dados.nome.trim(),
            guestPhone: cliente ? undefined : dados.telefone.replace(/\D/g, "") || undefined,
        })
    );

    const criado = resposta as { order?: OrderResponse; trackingToken?: string | null };
    const pedido = criado.order ?? {};
    const id = pedido.id as number;
    const codigo = pedido.code ?? String(id);

    // Sem conta, o código de acompanhamento só vem agora: guarda no navegador.
    if (criado.trackingToken) {
        guardarPedidoLocal({
            id,
            codigo,
            token: criado.trackingToken,
            criadoEm: pedido.createdAt ?? new Date().toISOString(),
        });
    }

    return { id, codigo };
}

/* ---------- Meus pedidos ---------- */

export interface MeuPedido {
    id: number;
    codigo: string;
    status: Status3;
    tipo: TipoEntregaCliente;
    total: number;
    quantidadeItens: number;
    criadoEm: string;
    /** Código de acompanhamento (pedido de visitante), para abrir os detalhes. */
    token: string | null;
}

export const STATUS_ATIVOS: Status3[] = ["PENDING", "IN_PREPARATION", "READY", "OUT_FOR_DELIVERY"];

function deResumo(p: OrderSummaryResponse): MeuPedido {
    return {
        id: p.id as number,
        codigo: p.code ?? String(p.id),
        status: p.status ?? "PENDING",
        tipo: p.fulfillmentType ?? "PICKUP",
        total: p.total ?? 0,
        quantidadeItens: p.itemCount ?? 0,
        criadoEm: p.createdAt ?? "",
        token: null,
    };
}

function deDetalhe(p: OrderResponse, token: string): MeuPedido {
    return {
        id: p.id as number,
        codigo: p.code ?? String(p.id),
        status: p.status ?? "PENDING",
        tipo: p.fulfillmentType ?? "PICKUP",
        total: p.total ?? 0,
        quantidadeItens: (p.items ?? []).reduce((t, i) => t + (i.quantity ?? 0), 0),
        criadoEm: p.createdAt ?? "",
        token,
    };
}

/**
 * Cliente logado: os pedidos da conta. Visitante: os guardados neste navegador, consultados
 * um a um com o código de acompanhamento.
 */
export async function listarMeusPedidos(me: Me | null): Promise<MeuPedido[]> {
    let pedidos: MeuPedido[];

    if (me?.type === "CLIENT") {
        const lista = await unwrapTodas((page, size) =>
            api.user.usersUserIdOrdersGet(me.userId, page, size)
        );
        pedidos = lista.map(deResumo);
    } else {
        const locais = lerPedidosLocais();
        const encontrados = await Promise.all(
            locais.map((l) =>
                unwrap(api.order.ordersIdGet(l.id, l.token))
                    .then((p) => deDetalhe(p, l.token))
                    .catch(() => null)
            )
        );
        pedidos = encontrados.filter((p): p is MeuPedido => p !== null);
    }

    return pedidos.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
}

export async function buscarMeuPedido(id: number, token: string | null): Promise<OrderResponse> {
    return unwrap(api.order.ordersIdGet(id, token ?? undefined));
}
