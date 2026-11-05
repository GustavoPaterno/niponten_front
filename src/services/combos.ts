import type { ComboResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas, unwrapVoid } from "@/src/lib/http";

export type ComboStatus = "ACTIVE" | "INACTIVE";

/** Associação combo + produto. `id` é o id da associação (usado para remover). */
export interface ComboProduto {
    id: number;
    productId: number;
    /** Id da associação produto + tamanho (ProductSize). `null` quando o produto não tem tamanhos. */
    productSizeId: number | null;
    name: string;
}

/** Um produto do combo e o tamanho escolhido. */
export interface ComboItemInput {
    productId: number;
    /** Obrigatório no backend quando o produto tem tamanhos. */
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
}

/** Mínimo de produtos que o backend exige em um combo. */
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

/** Lista combos com os nomes dos produtos (o GET /combos não traz os produtos). */
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

// Cada produto entra uma vez no combo (quantidade 1).
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
    await unwrap(
        api.combo.combosPost({
            combo: toRequest(input, null),
            products: input.itens.map(toItemRequest),
        })
    );
}

/**
 * Edita um combo.
 *
 * O PUT /combos/{id} só altera os dados básicos. Os produtos são um sub-recurso, então
 * comparamos o estado atual com o desejado. Os novos entram ANTES dos removidos, porque o
 * backend não deixa o combo ficar com menos de 2 produtos. Não é uma transação: se uma
 * etapa falhar, as anteriores já foram aplicadas, então a lista deve ser recarregada.
 */
export async function atualizarCombo(
    atual: Combo,
    input: ComboInput
): Promise<void> {
    await unwrap(
        api.combo.combosIdPut(atual.id, toRequest(input, atual.imageUrl))
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
            // Mesmo produto, outro tamanho: atualiza a associação em vez de remover e recriar.
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
