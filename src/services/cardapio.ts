import type {
    ComboResponse,
    ProductDetailResponse,
    PromotionResponse,
} from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas } from "@/src/lib/http";

/**
 * Dados do cardápio do cliente (tela /menu). Tudo aqui é público no backend:
 * funciona com ou sem login. Só entra o que dá para pedir agora.
 */

export interface ItemProduto {
    id: number;
    nome: string;
    descricao: string;
    imagem: string | null;
    /** Menor preço entre os tamanhos ativos. */
    precoMinimo: number;
    /** true quando há mais de um tamanho (o preço é "a partir de"). */
    variosPrecos: boolean;
    href: string;
}

export interface ItemPromocao {
    id: number;
    nome: string;
    descricao: string;
    imagem: string | null;
    precoPromocional: number;
    precoOriginal: number;
    /** Desconto em % sobre o preço original, já arredondado (ex.: 20). */
    desconto: number;
    variosPrecos: boolean;
    href: string;
}

export interface ItemCombo {
    id: number;
    nome: string;
    descricao: string;
    imagem: string | null;
    preco: number;
    /** Último dia em que o combo vale, quando tiver data de fim. */
    validoAte: string | null;
    href: string;
}

export interface Cardapio {
    promocoes: ItemPromocao[];
    combos: ItemCombo[];
    produtos: ItemProduto[];
}

export function hrefProduto(id: number): string {
    return `/menu/produto/${id}`;
}

function toProduto(detalhe: ProductDetailResponse): ItemProduto | null {
    const precos = (detalhe.sizes ?? [])
        .filter((tamanho) => tamanho.status === "ACTIVE")
        .map((tamanho) => tamanho.price ?? 0);

    // Sem nenhum tamanho ativo não há o que pedir.
    if (precos.length === 0) {
        return null;
    }

    return {
        id: detalhe.id as number,
        nome: detalhe.name ?? "",
        descricao: detalhe.description ?? "",
        imagem: detalhe.imageUrl || null,
        precoMinimo: Math.min(...precos),
        variosPrecos: precos.length > 1,
        href: hrefProduto(detalhe.id as number),
    };
}

function toPromocao(
    promocao: PromotionResponse,
    produtos: Map<number, ItemProduto>
): ItemPromocao | null {
    const precos = (promocao.prices ?? []).filter(
        (p) => p.promotionalPrice !== undefined && p.originalPrice
    );
    const produto = produtos.get(promocao.productId as number);

    // A promoção só aparece se o produto dela estiver à venda.
    if (precos.length === 0 || !produto) {
        return null;
    }

    // Mostra o tamanho com o menor preço promocional.
    const maisBarato = precos.reduce((menor, atual) =>
        (atual.promotionalPrice ?? 0) < (menor.promotionalPrice ?? 0) ? atual : menor
    );
    const original = maisBarato.originalPrice ?? 0;
    const promocional = maisBarato.promotionalPrice ?? 0;

    return {
        id: promocao.id as number,
        nome: promocao.title || produto.nome,
        descricao: promocao.description || produto.descricao,
        imagem: promocao.imageUrl || produto.imagem,
        precoPromocional: promocional,
        precoOriginal: original,
        desconto: original > 0 ? Math.round((1 - promocional / original) * 100) : 0,
        variosPrecos: precos.length > 1,
        href: `${hrefProduto(produto.id)}?promocao=${promocao.id}`,
    };
}

function toCombo(combo: ComboResponse): ItemCombo {
    return {
        id: combo.id as number,
        nome: combo.name ?? "",
        descricao: combo.description ?? "",
        imagem: combo.imageUrl || null,
        preco: combo.price ?? 0,
        validoAte: combo.endDate ?? null,
        href: `${hrefProduto(combo.id as number)}?tipo=combo`,
    };
}

export async function buscarCardapio(): Promise<Cardapio> {
    const [produtosBase, combos, promocoes] = await Promise.all([
        unwrapTodas((page, size) => api.product.productsGet(page, size)),
        // available=true: o backend já devolve só o que vale hoje.
        unwrapTodas((page, size) => api.combo.combosGet(true, page, size)),
        unwrapTodas((page, size) => api.promotion.promotionsGet(true, page, size)),
    ]);

    // A lista de produtos não traz os tamanhos (e os preços): busca o detalhe de cada um.
    const detalhes = await Promise.all(
        produtosBase
            .filter((p) => p.status === "ACTIVE")
            .map((p) => unwrap(api.product.productsIdGet(p.id as number)))
    );

    const produtos = detalhes
        .map(toProduto)
        .filter((p): p is ItemProduto => p !== null);
    const porId = new Map(produtos.map((p) => [p.id, p]));

    return {
        promocoes: promocoes
            .filter((p) => p.status === "ACTIVE")
            .map((p) => toPromocao(p, porId))
            .filter((p): p is ItemPromocao => p !== null),
        combos: combos.filter((c) => c.status === "ACTIVE").map(toCombo),
        produtos: produtos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    };
}
