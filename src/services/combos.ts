import type { ComboResponse } from "nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapVoid } from "@/src/lib/http";

export type ComboStatus = "ACTIVE" | "INACTIVE";

/** Associação combo + produto. `id` é o id da associação (usado para remover). */
export interface ComboProduto {
    id: number;
    productId: number;
    name: string;
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

    // Derivado, pronto para exibição e busca na tabela.
    produtosTexto: string;
}

export interface ComboInput {
    name: string;
    description: string;
    price: number;
    status: ComboStatus;
    startDate?: string;
    endDate?: string;
    productIds: number[];
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
        unwrap(api.combo.combosGet()),
        unwrap(api.product.productsGet()),
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
                    name: nomes.get(a.productId as number) ?? "—",
                }))
            );
        })
    );
}

function toRequest(input: ComboInput, imageUrl: string | null) {
    return {
        name: input.name.trim(),
        description: input.description.trim() || undefined,
        // Imagens ficam para uma próxima etapa: só preservamos a que já existe.
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
            products: input.productIds.map((productId) => ({ productId })),
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

    const desejados = new Set(input.productIds);
    const existentes = new Set(atual.produtos.map((p) => p.productId));

    for (const productId of input.productIds) {
        if (!existentes.has(productId)) {
            await unwrap(
                api.combo.combosComboIdProductsPost(atual.id, { productId })
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
                    productIds: [],
                },
                combo.imageUrl
            )
        )
    );
}

export async function excluirCombo(id: number): Promise<void> {
    await unwrapVoid(api.combo.combosIdDelete(id));
}
