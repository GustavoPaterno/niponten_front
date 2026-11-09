"use client";

/**
 * Pedidos feitos sem login, guardados no navegador. O backend não lista pedidos de visitante:
 * cada um só pode ser consultado com o código de acompanhamento (tracking token), que vem uma
 * única vez na criação. Sem guardar aqui, o visitante perde o acesso ao próprio pedido.
 */

const CHAVE = "marusan.pedidos.v1";

export interface PedidoLocal {
    id: number;
    codigo: string;
    token: string;
    criadoEm: string;
}

export function lerPedidosLocais(): PedidoLocal[] {
    try {
        const lido = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
        return Array.isArray(lido) ? lido : [];
    } catch {
        return [];
    }
}

export function guardarPedidoLocal(pedido: PedidoLocal) {
    try {
        const outros = lerPedidosLocais().filter((p) => p.id !== pedido.id);
        localStorage.setItem(CHAVE, JSON.stringify([pedido, ...outros]));
    } catch {
        // Sem localStorage: o pedido foi feito, só não fica listado neste navegador.
    }
}
