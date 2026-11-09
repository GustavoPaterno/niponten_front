import type { OrderQuoteResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { paraPedido, type ItemCarrinho } from "@/src/lib/carrinho";

/**
 * Confere o carrinho com o backend (POST /orders/quote, público). O backend devolve o preço
 * oficial de cada item (já com promoções automáticas) ou recusa a cotação inteira, listando
 * o problema de cada item. Aqui os itens com problema são separados e os demais cotados de novo.
 */

export interface CotacaoItem {
    /** Preço de 1 unidade com adicionais, segundo o backend. */
    precoUnitario: number;
    /** Preço sem promoção, quando o backend aplicou uma. */
    precoOriginal: number | null;
    total: number;
}

export interface Cotacao {
    /** Por chave do item do carrinho. */
    itens: Record<string, CotacaoItem>;
    /** Motivos de cada item recusado, por chave. */
    problemas: Record<string, string[]>;
    /** Soma só dos itens válidos. */
    subtotal: number;
    total: number;
}

interface Violacao {
    field?: string;
    message?: string;
}

// Mensagens do backend (em inglês) -> português, para mostrar no item.
const TRADUCOES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/^(.+) is not offered as an additional for /, (m) => `${m[1]} não é oferecido como adicional deste produto.`],
    [/^Additional (.+) allows at most (\d+)/, (m) => `${m[1]}: no máximo ${m[2]} unidades.`],
    [/^Additional (.+) is unavailable/, (m) => `O adicional ${m[1]} está indisponível.`],
    [/^Ingredient (.+) is out of stock/, (m) => `${m[1]} está esgotado.`],
    [/^Ingredient (.+) is not part of /, (m) => `${m[1]} não faz parte deste produto.`],
    [/^Product (.+) is unavailable/, () => "Este produto está indisponível no momento."],
    [/^Combo (.+) is unavailable/, () => "Este combo está indisponível no momento."],
    [/^Size (.+) is unavailable/, () => "Este tamanho está indisponível no momento."],
    [/is out of stock/, () => "Um ingrediente deste item está esgotado."],
    [/is unavailable|not found/i, () => "Este item está indisponível no momento."],
];

function traduzir(mensagem: string): string {
    for (const [padrao, converter] of TRADUCOES) {
        const m = mensagem.match(padrao);

        if (m) {
            return converter(m);
        }
    }

    return "Este item não pode ser pedido assim. Tente remover e adicionar de novo.";
}

type Resultado =
    | { ok: true; resposta: OrderQuoteResponse }
    | { ok: false; violacoes: Violacao[] };

async function cotar(itens: ItemCarrinho[]): Promise<Resultado> {
    try {
        const resposta = await api.order.ordersQuotePost({ items: itens.map(paraPedido) });

        return { ok: true, resposta: resposta.data };
    } catch (erro) {
        const dados = (erro as { response?: { status: number; data?: { violations?: Violacao[] } } })
            .response;

        if (dados?.status === 400 && Array.isArray(dados.data?.violations)) {
            return { ok: false, violacoes: dados.data.violations };
        }

        throw erro;
    }
}

function montar(itens: ItemCarrinho[], resposta: OrderQuoteResponse): Omit<Cotacao, "problemas"> {
    const porChave: Record<string, CotacaoItem> = {};

    // A resposta vem na mesma ordem dos itens enviados.
    (resposta.items ?? []).forEach((cotado, i) => {
        const item = itens[i];

        if (!item) {
            return;
        }

        const quantidade = cotado.quantity || item.quantidade;
        const total = cotado.total ?? 0;
        const promocao =
            cotado.originalUnitPrice !== undefined &&
            cotado.unitPrice !== undefined &&
            cotado.unitPrice < cotado.originalUnitPrice;

        porChave[item.chave] = {
            precoUnitario: total / quantidade,
            precoOriginal: promocao
                ? total / quantidade + ((cotado.originalUnitPrice ?? 0) - (cotado.unitPrice ?? 0))
                : null,
            total,
        };
    });

    return {
        itens: porChave,
        subtotal: resposta.subtotal ?? 0,
        total: resposta.total ?? resposta.subtotal ?? 0,
    };
}

export async function cotarCarrinho(itens: ItemCarrinho[]): Promise<Cotacao> {
    if (itens.length === 0) {
        return { itens: {}, problemas: {}, subtotal: 0, total: 0 };
    }

    const primeira = await cotar(itens);

    if (primeira.ok) {
        return { ...montar(itens, primeira.resposta), problemas: {} };
    }

    // "items[2].additionals[0]" -> item 2.
    const problemas: Record<string, string[]> = {};

    for (const violacao of primeira.violacoes) {
        const indice = Number(violacao.field?.match(/^items\[(\d+)\]/)?.[1]);
        const item = Number.isInteger(indice) ? itens[indice] : undefined;

        if (item) {
            (problemas[item.chave] ??= []).push(traduzir(violacao.message ?? ""));
        }
    }

    const validos = itens.filter((item) => !problemas[item.chave]);

    // Se não deu para ligar as violações a itens, não há o que recotar.
    if (validos.length === itens.length || validos.length === 0) {
        if (validos.length === itens.length) {
            for (const item of itens) {
                problemas[item.chave] = ["Não foi possível conferir este item."];
            }
        }

        return { itens: {}, problemas, subtotal: 0, total: 0 };
    }

    const segunda = await cotar(validos);

    return segunda.ok
        ? { ...montar(validos, segunda.resposta), problemas }
        : { itens: {}, problemas, subtotal: 0, total: 0 };
}
