import type { ComboResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas, unwrapVoid } from "@/src/lib/http";
import { aplicarImagem, SEM_ALTERACAO, type ImagemEscolha } from "@/src/lib/uploadImagem";

export type ComboStatus = "ACTIVE" | "INACTIVE";

export interface ComboProduto {
    id: number;
    productId: number;
    productSizeId: number | null;
    name: string;
}

export interface ComboItemInput {
    productId: number;
    productSizeId: number | null;
}

export interface Combo {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    price: number;
    status: ComboStatus;
    startDate: string | null;
    endDate: string | null;
    produtos: ComboProduto[];

    produtosTexto: string;
}

export interface ComboInput {
    name: string;
    description: string;
    price: number;
    status: ComboStatus;
    startDate?: string;
    endDate?: string;
    itens: ComboItemInput[];
    imagem?: ImagemEscolha;
}

export const MINIMO_PRODUTOS_COMBO = 2;

function montarCombo(
    response: ComboResponse,
    produtos: ComboProduto[]
): Combo {
    return {
        id: response.id as number,
        name: response.name ?? "",
        description: response.description ?? "",
        imageUrl: response.imageUrl ?? null,
        price: response.price ?? 0,
        status: response.status ?? "ACTIVE",
        startDate: response.startDate ?? null,
        endDate: response.endDate ?? null,
        produtos,
        produtosTexto: produtos.map((p) => p.name).join(", "),
    };
}

export async function listarCombos(): Promise<Combo[]> {
    const [combos, produtos] = await Promise.all([
        unwrapTodas((page, size) => api.combo.combosGet(undefined, page, size)),
        unwrapTodas((page, size) => api.product.productsGet(page, size)),
    ]);

    const nomes = new Map<number, string>(
        (produtos ?? []).map((p) => [p.id as number, p.name ?? ""])
    );

    return Promise.all(
        (combos ?? []).map(async (combo) => {
            const associacoes = await unwrap(
                api.combo.combosComboIdProductsGet(combo.id as number)
            );

            return montarCombo(
                combo,
                (associacoes ?? []).map((a) => ({
                    id: a.id as number,
                    productId: a.productId as number,
                    productSizeId: a.productSizeId ?? null,
                    name: nomes.get(a.productId as number) ?? "—",
                }))
            );
        })
    );
}

function toItemRequest(item: ComboItemInput) {
    return {
        productId: item.productId,
        productSizeId: item.productSizeId ?? undefined,
        quantity: 1,
    };
}

function toRequest(input: ComboInput, imageUrl: string | null) {
    return {
        name: input.name.trim(),
        description: input.description.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        price: input.price,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
    };
}

export async function criarCombo(input: ComboInput): Promise<void> {
    await aplicarImagem(
        null,
        input.imagem ?? SEM_ALTERACAO,
        (imageUrl) =>
            unwrap(
                api.combo.combosPost({
                    combo: toRequest(input, imageUrl),
                    products: input.itens.map(toItemRequest),
                })
            ),
        (resposta) => resposta.imageUrl
    );
}

export async function atualizarCombo(
    atual: Combo,
    input: ComboInput
): Promise<void> {
    await aplicarImagem(
        atual.imageUrl,
        input.imagem ?? SEM_ALTERACAO,
        (imageUrl) => unwrap(api.combo.combosIdPut(atual.id, toRequest(input, imageUrl))),
        (resposta) => resposta.imageUrl
    );

    const desejados = new Map(input.itens.map((item) => [item.productId, item]));
    const existentes = new Map(atual.produtos.map((p) => [p.productId, p]));

    for (const item of input.itens) {
        const existente = existentes.get(item.productId);

        if (!existente) {
            await unwrap(
                api.combo.combosComboIdProductsPost(atual.id, toItemRequest(item))
            );
        } else if (existente.productSizeId !== item.productSizeId) {
            await unwrap(
                api.combo.combosComboIdProductsComboProductIdPut(
                    atual.id,
                    existente.id,
                    toItemRequest(item)
                )
            );
        }
    }

    for (const associacao of atual.produtos) {
        if (!desejados.has(associacao.productId)) {
            await unwrapVoid(
                api.combo.combosComboIdProductsComboProductIdDelete(
                    atual.id,
                    associacao.id
                )
            );
        }
    }
}

export async function alterarStatusCombo(
    combo: Combo,
    status: ComboStatus
): Promise<void> {
    await unwrap(
        api.combo.combosIdPut(
            combo.id,
            toRequest(
                {
                    name: combo.name,
                    description: combo.description,
                    price: combo.price,
                    status,
                    startDate: combo.startDate ?? undefined,
                    endDate: combo.endDate ?? undefined,
                    itens: [],
                },
                combo.imageUrl
            )
        )
    );
}

export async function excluirCombo(id: number): Promise<void> {
    await unwrapVoid(api.combo.combosIdDelete(id));
}
