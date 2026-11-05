"use client";

import { useSyncExternalStore } from "react";
import type { OrderItemRequest } from "@joao.sumi/nippon-ten";

/**
 * Carrinho do cliente, guardado só no navegador (localStorage). Não existe carrinho no backend:
 * ele vive aqui até o pedido ser enviado. Vale para visitante e para logado, um por navegador.
 *
 * Os preços guardados são os da hora em que o item entrou no carrinho. Antes de fechar o pedido,
 * o ideal é conferir com POST /orders/quote, que devolve os valores atuais.
 */

const CHAVE = "marusan.carrinho.v1";
const EVENTO = "marusan:carrinho";

export interface AdicionalCarrinho {
    ingredientId: number;
    nome: string;
    preco: number;
    quantidade: number;
}

export interface RemovidoCarrinho {
    ingredientId: number;
    nome: string;
}

interface ItemBase {
    /** Identificador local do item no carrinho. */
    chave: string;
    nome: string;
    imagem: string | null;
    /** Preço de 1 unidade sem adicionais (já com promoção, se houver). */
    precoUnitario: number;
    quantidade: number;
    observacao: string;
}

export interface ItemProdutoCarrinho extends ItemBase {
    tipo: "PRODUCT";
    productId: number;
    productSizeId: number;
    tamanho: string | null;
    promocaoId: number | null;
    adicionais: AdicionalCarrinho[];
    removidos: RemovidoCarrinho[];
}

export interface ItemComboCarrinho extends ItemBase {
    tipo: "COMBO";
    comboId: number;
}

export type ItemCarrinho = ItemProdutoCarrinho | ItemComboCarrinho;

/** O que a tela manda para o carrinho: sem a chave e a quantidade somada, que são daqui. */
export type NovoItemCarrinho =
    | Omit<ItemProdutoCarrinho, "chave">
    | Omit<ItemComboCarrinho, "chave">;

const VAZIO: ItemCarrinho[] = [];

// Cache do último valor lido: useSyncExternalStore exige a mesma referência enquanto nada mudar.
let ultimoTexto: string | null = null;
let ultimoValor: ItemCarrinho[] = VAZIO;

function ler(): ItemCarrinho[] {
    let texto: string | null = null;

    try {
        texto = localStorage.getItem(CHAVE);
    } catch {
        // Navegador sem localStorage (ex.: modo privado restrito): carrinho vazio.
    }

    if (texto === ultimoTexto) {
        return ultimoValor;
    }

    ultimoTexto = texto;

    try {
        const lido = texto ? JSON.parse(texto) : [];
        ultimoValor = Array.isArray(lido) ? lido : VAZIO;
    } catch {
        ultimoValor = VAZIO;
    }

    return ultimoValor;
}

function gravar(itens: ItemCarrinho[]) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
        // Sem espaço ou sem permissão: o carrinho só não persiste.
    }

    window.dispatchEvent(new Event(EVENTO));
}

function assinar(callback: () => void) {
    // "storage" avisa quando o carrinho muda em outra aba.
    window.addEventListener(EVENTO, callback);
    window.addEventListener("storage", callback);

    return () => {
        window.removeEventListener(EVENTO, callback);
        window.removeEventListener("storage", callback);
    };
}

/** Itens do carrinho, atualizados automaticamente (inclusive entre abas). */
export function useCarrinho(): ItemCarrinho[] {
    return useSyncExternalStore(assinar, ler, () => VAZIO);
}

/** Dois itens iguais (mesmo produto, tamanho, adicionais, remoções e observação) viram um só. */
function assinatura(item: NovoItemCarrinho | ItemCarrinho): string {
    if (item.tipo === "COMBO") {
        return JSON.stringify(["COMBO", item.comboId, item.observacao.trim()]);
    }

    return JSON.stringify([
        "PRODUCT",
        item.productSizeId,
        item.promocaoId,
        [...item.adicionais]
            .sort((a, b) => a.ingredientId - b.ingredientId)
            .map((a) => [a.ingredientId, a.quantidade]),
        item.removidos.map((r) => r.ingredientId).sort((a, b) => a - b),
        item.observacao.trim(),
    ]);
}

export function adicionarAoCarrinho(novo: NovoItemCarrinho) {
    const itens = ler();
    const igual = itens.find((item) => assinatura(item) === assinatura(novo));

    if (igual) {
        gravar(
            itens.map((item) =>
                item === igual
                    ? { ...item, quantidade: item.quantidade + novo.quantidade }
                    : item
            )
        );
        return;
    }

    const chave =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    gravar([...itens, { ...novo, chave } as ItemCarrinho]);
}

export function alterarQuantidade(chave: string, quantidade: number) {
    gravar(
        quantidade <= 0
            ? ler().filter((item) => item.chave !== chave)
            : ler().map((item) => (item.chave === chave ? { ...item, quantidade } : item))
    );
}

export function removerDoCarrinho(chave: string) {
    gravar(ler().filter((item) => item.chave !== chave));
}

export function limparCarrinho() {
    gravar([]);
}

/** Preço de 1 unidade do item, com os adicionais. */
export function precoDoItem(item: ItemCarrinho): number {
    const adicionais =
        item.tipo === "PRODUCT"
            ? item.adicionais.reduce((total, a) => total + a.preco * a.quantidade, 0)
            : 0;

    return item.precoUnitario + adicionais;
}

export function totalDoItem(item: ItemCarrinho): number {
    return precoDoItem(item) * item.quantidade;
}

export function quantidadeTotal(itens: ItemCarrinho[]): number {
    return itens.reduce((total, item) => total + item.quantidade, 0);
}

/** Converte para o formato do pedido do backend (POST /orders e /orders/quote). */
export function paraPedido(item: ItemCarrinho): OrderItemRequest {
    if (item.tipo === "COMBO") {
        return {
            type: "COMBO",
            comboId: item.comboId,
            quantity: item.quantidade,
            notes: item.observacao.trim() || undefined,
        };
    }

    return {
        type: "PRODUCT",
        productSizeId: item.productSizeId,
        quantity: item.quantidade,
        notes: item.observacao.trim() || undefined,
        additionals: item.adicionais.map((a) => ({
            ingredientId: a.ingredientId,
            quantity: a.quantidade,
        })),
        removedIngredientIds: item.removidos.map((r) => r.ingredientId),
    };
}
