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
import type { EntregaCotacao } from "@/src/services/cotacao";
import { localidade } from "@/src/services/entrega";
import { opcaoDePagamento, type FormaEscolhida, type PedidoAPagar } from "@/src/services/pagamento";

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
    /**
     * Vêm da consulta do CEP, só para mostrar: o backend completa bairro, cidade e UF pelo CEP
     * e não os aceita no corpo.
     */
    bairro: string;
    cidade: string;
    uf: string;
}

export interface EnderecoSalvo {
    id: number;
    resumo: string;
    detalhe: string;
}

/**
 * O backend não tem "ponto de referência": ele vai junto do complemento, que é o que aparece no
 * endereço do pedido no painel ("Apto 2, Ref.: ao lado da padaria").
 */
function complementoComReferencia(e: EnderecoInput): string | undefined {
    const partes = [
        e.complemento.trim(),
        e.referencia.trim() ? `Ref.: ${e.referencia.trim()}` : "",
    ].filter(Boolean);

    return partes.length ? partes.join(", ") : undefined;
}

/** CEP com 8 dígitos, rua e número: dá para localizar e calcular a taxa. */
export function enderecoCompleto(e: EnderecoInput): boolean {
    return e.cep.replace(/\D/g, "").length === 8 && e.rua.trim() !== "" && e.numero.trim() !== "";
}

/**
 * Entrega para a cotação. O endereço digitado só entra quando completo; o complemento não muda a
 * localização e fica de fora, para não recotar (e geolocalizar de novo) a cada letra.
 */
export function entregaParaCotacao(
    tipo: TipoEntregaCliente | null,
    opcoes: { enderecoId: number | null; endereco: EnderecoInput | null }
): EntregaCotacao | null {
    if (!tipo) {
        return null;
    }

    if (tipo !== "DELIVERY") {
        return { tipo };
    }

    if (opcoes.enderecoId) {
        return { tipo, addressId: opcoes.enderecoId };
    }

    if (opcoes.endereco && enderecoCompleto(opcoes.endereco)) {
        return {
            tipo,
            address: {
                cep: opcoes.endereco.cep.replace(/\D/g, ""),
                streetAddress: opcoes.endereco.rua.trim(),
                number: opcoes.endereco.numero.trim(),
            },
        };
    }

    return { tipo };
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
        detalhe: [
            e.complement,
            localidade({ bairro: e.neighborhood, cidade: e.city, uf: e.state }),
            e.cep ? `CEP ${e.cep}` : "",
        ]
            .filter(Boolean)
            .join(", "),
    }));
}

export interface DadosFinalizacao {
    tipo: TipoEntregaCliente;
    /** Visitante (e funcionário pedindo pelo balcão): nome e telefone. */
    nome: string;
    telefone: string;
    /** Obrigatório para visitante (link de acompanhamento); opcional para funcionário. */
    email: string;
    forma: FormaEscolhida;
    /** Pontos a usar como desconto. Só vale para cliente logado. */
    pontos: number;
    /** Cliente logado: endereço salvo escolhido. */
    enderecoId: number | null;
    /** Endereço novo (visitante sempre; cliente quando cadastra um). */
    endereco: EnderecoInput | null;
}

export type PedidoCriado = PedidoAPagar;

/**
 * Cria o pedido. Regras do backend:
 * - visitante: nome, telefone e e-mail obrigatórios; endereço digitado no delivery;
 * - cliente: sem nome/telefone/e-mail; no delivery só aceita endereço salvo (addressId), então um
 *   endereço novo é salvo na conta antes. Só ele pode usar pontos;
 * - funcionário (com permissão Pedidos): pede como visitante, pelo balcão (e-mail opcional).
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

    const pagamento = opcaoDePagamento(dados.forma);

    const resposta = await unwrap(
        api.order.ordersPost({
            items: itens.map(paraPedido),
            fulfillmentType: dados.tipo,
            paymentMethod: pagamento.metodo,
            paymentChannel: pagamento.canal,
            notes: pagamento.observacao,
            pointsToRedeem: cliente && dados.pontos > 0 ? dados.pontos : undefined,
            addressId,
            address: !cliente && delivery && dados.endereco ? paraEnderecoRequest(dados.endereco) : undefined,
            guestName: cliente ? undefined : dados.nome.trim(),
            guestPhone: cliente ? undefined : dados.telefone.replace(/\D/g, "") || undefined,
            guestEmail: cliente ? undefined : dados.email.trim() || undefined,
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

    return { id, codigo, total: pedido.total ?? 0, token: criado.trackingToken ?? null };
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

export const STATUS_ATIVOS: Status3[] = [
    "AWAITING_PAYMENT",
    "PENDING",
    "IN_PREPARATION",
    "READY",
    "OUT_FOR_DELIVERY",
];

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
            api.user.usersUserIdOrdersGet(me.userId, undefined, page, size)
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
