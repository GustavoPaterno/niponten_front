import type {
    ProductDetailResponse,
    ProductResponse,
} from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas, unwrapVoid } from "@/src/lib/http";

import type { Ingrediente } from "./ingredientes";
import { toIngrediente } from "./ingredientes";
import type { Tamanho } from "./tamanhos";

export type ProdutoStatus = "ACTIVE" | "INACTIVE";

/** Associação produto + ingrediente. `id` é o id da associação (usado para remover). */
export interface ProdutoIngrediente {
    id: number;
    ingredientId: number;
    name: string;
}

/**
 * Associação produto + tamanho, que carrega o preço.
 * `id` é o id da associação (productSize), NÃO o id do tamanho do catálogo (`sizeId`).
 */
export interface ProdutoTamanho {
    id: number;
    sizeId: number;
    name: string;
    price: number;
    status: ProdutoStatus;
}

/**
 * Adicional liberado para o produto (o cliente só pode pedir estes).
 * `id` é o id da associação produto + ingrediente adicional (usado para editar/remover).
 */
export interface ProdutoAdicional {
    id: number;
    ingredientId: number;
    name: string;
    maximo: number;
    status: ProdutoStatus;
}

export interface Produto {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    status: ProdutoStatus;
    ingredientes: ProdutoIngrediente[];
    tamanhos: ProdutoTamanho[];
    adicionais: ProdutoAdicional[];

    ingredientesTexto: string;
    tamanhosTexto: string;
    precoMinimo: number | null;
}

export interface ProdutoTamanhoInput {
    sizeId: number;
    price: number;
    status: ProdutoStatus;
}

export interface ProdutoAdicionalInput {
    ingredientId: number;
    maximo: number;
    status: ProdutoStatus;
}

export interface ProdutoInput {
    name: string;
    description: string;
    status: ProdutoStatus;
    ingredientIds: number[];
    sizes: ProdutoTamanhoInput[];
    adicionais: ProdutoAdicionalInput[];
}

export interface ProdutoDependentes {
    combos: string[];
    promocoes: string[];
}

export function precoMinimo(tamanhos: ProdutoTamanho[]): number | null {
    const ativos = tamanhos.filter((t) => t.status === "ACTIVE");
    const base = ativos.length > 0 ? ativos : tamanhos;

    if (base.length === 0) {
        return null;
    }

    return Math.min(...base.map((t) => t.price));
}

function montarProduto(
    detalhe: ProductDetailResponse,
    ingredientes: Map<number, Ingrediente>,
    tamanhos: Map<number, Tamanho>
): Produto {
    const listaIngredientes: ProdutoIngrediente[] = (
        detalhe.ingredients ?? []
    ).map((item) => ({
        id: item.id as number,
        ingredientId: item.ingredientId as number,
        name: ingredientes.get(item.ingredientId as number)?.name ?? "—",
    }));

    const listaTamanhos: ProdutoTamanho[] = (detalhe.sizes ?? []).map(
        (item) => ({
            id: item.id as number,
            sizeId: item.sizeId as number,
            name: tamanhos.get(item.sizeId as number)?.name ?? "—",
            price: item.price ?? 0,
            status: item.status ?? "ACTIVE",
        })
    );

    const listaAdicionais: ProdutoAdicional[] = (detalhe.additionalIngredients ?? []).map(
        (item) => ({
            id: item.id as number,
            ingredientId: item.ingredientId as number,
            name: ingredientes.get(item.ingredientId as number)?.name ?? "—",
            maximo: item.maximumQuantity ?? 1,
            status: item.status ?? "ACTIVE",
        })
    );

    return {
        id: detalhe.id as number,
        name: detalhe.name ?? "",
        description: detalhe.description ?? "",
        imageUrl: detalhe.imageUrl ?? null,
        status: detalhe.status ?? "ACTIVE",
        ingredientes: listaIngredientes,
        tamanhos: listaTamanhos,
        adicionais: listaAdicionais,
        ingredientesTexto: listaIngredientes.map((i) => i.name).join(", "),
        tamanhosTexto: listaTamanhos.map((t) => t.name).join(", "),
        precoMinimo: precoMinimo(listaTamanhos),
    };
}

/**
 * Lista produtos já com ingredientes e tamanhos resolvidos.
 * O GET /products não traz esses dados, então busca o detalhe de cada produto
 * (em paralelo) e os catálogos de ingredientes e tamanhos para obter os nomes.
 */
export async function listarProdutos(): Promise<Produto[]> {
    const [produtos, ingredientes, tamanhos] = await Promise.all([
        unwrapTodas((page, size) => api.product.productsGet(page, size)),
        unwrapTodas((page, size) => api.ingredient.ingredientsGet(page, size)),
        unwrapTodas((page, size) => api.size.sizesGet(page, size)),
    ]);

    const mapaIngredientes = new Map<number, Ingrediente>(
        (ingredientes ?? []).map((i) => [i.id as number, toIngrediente(i)])
    );
    const mapaTamanhos = new Map<number, Tamanho>(
        (tamanhos ?? []).map((t) => [
            t.id as number,
            { id: t.id as number, name: t.name ?? "" },
        ])
    );

    const detalhes = await Promise.all(
        (produtos ?? []).map((p: ProductResponse) =>
            unwrap(api.product.productsIdGet(p.id as number))
        )
    );

    return detalhes.map((d) => montarProduto(d, mapaIngredientes, mapaTamanhos));
}

function paraAdicionalRequest(a: ProdutoAdicionalInput) {
    return { ingredientId: a.ingredientId, maximumQuantity: a.maximo, status: a.status };
}

/**
 * O cadastro do produto não aceita adicionais: eles entram logo depois, em lote, com o id
 * do produto criado.
 */
export async function criarProduto(input: ProdutoInput): Promise<void> {
    const criado = await unwrap(
        api.product.productsPost({
            product: {
                name: input.name.trim(),
                description: input.description.trim() || undefined,
                status: input.status,
            },
            ingredients: input.ingredientIds.map((ingredientId) => ({
                ingredientId,
            })),
            sizes: input.sizes,
        })
    );

    if (input.adicionais.length > 0) {
        await unwrap(
            api.product.productsProductIdAdditionalIngredientsPost(
                criado.id as number,
                input.adicionais.map(paraAdicionalRequest)
            )
        );
    }
}

/**
 * Edita um produto.
 *
 * O PUT /products/{id} só altera nome, descrição e status. Ingredientes e tamanhos são
 * sub-recursos, então comparamos o estado atual com o desejado e chamamos as rotas de
 * adicionar / atualizar / remover. Os tamanhos novos entram ANTES dos removidos, porque
 * o backend não permite que o produto fique sem nenhum tamanho.
 *
 * Não é uma transação: se uma etapa falhar, as anteriores já foram aplicadas. Quem chama
 * deve recarregar a lista para refletir o estado real.
 */
export async function atualizarProduto(
    atual: Produto,
    input: ProdutoInput
): Promise<void> {
    await unwrap(
        api.product.productsIdPut(atual.id, {
            name: input.name.trim(),
            description: input.description.trim() || undefined,
            imageUrl: atual.imageUrl ?? undefined,
            status: input.status,
        })
    );

    const idsDesejados = new Set(input.ingredientIds);
    const idsAtuais = new Set(atual.ingredientes.map((i) => i.ingredientId));

    // O backend recebe os ingredientes novos em lote, numa chamada só.
    const novos = input.ingredientIds.filter((id) => !idsAtuais.has(id));

    if (novos.length > 0) {
        await unwrap(
            api.product.productsProductIdIngredientsPost(
                atual.id,
                novos.map((ingredientId) => ({ ingredientId }))
            )
        );
    }

    for (const existente of atual.ingredientes) {
        if (!idsDesejados.has(existente.ingredientId)) {
            await unwrapVoid(
                api.product.productsProductIdIngredientsProductIngredientIdDelete(
                    atual.id,
                    existente.id
                )
            );
        }
    }

    const tamanhosAtuais = new Map(atual.tamanhos.map((t) => [t.sizeId, t]));
    const tamanhosDesejados = new Set(input.sizes.map((s) => s.sizeId));

    for (const desejado of input.sizes) {
        const existente = tamanhosAtuais.get(desejado.sizeId);

        if (!existente) {
            await unwrap(
                api.product.productsProductIdSizesPost(atual.id, desejado)
            );
        } else if (
            existente.price !== desejado.price ||
            existente.status !== desejado.status
        ) {
            await unwrap(
                api.product.productsProductIdSizesSizeIdPut(
                    atual.id,
                    existente.id,
                    desejado
                )
            );
        }
    }

    for (const existente of atual.tamanhos) {
        if (!tamanhosDesejados.has(existente.sizeId)) {
            await unwrapVoid(
                api.product.productsProductIdSizesSizeIdDelete(
                    atual.id,
                    existente.id
                )
            );
        }
    }

    await sincronizarAdicionais(atual, input.adicionais);
}

/**
 * Adicionais também são sub-recurso: novos em lote, alterados um a um, removidos um a um.
 * O backend não impede repetir um ingrediente já liberado, então só os que ainda não
 * existem vão no lote.
 */
async function sincronizarAdicionais(atual: Produto, desejados: ProdutoAdicionalInput[]) {
    const atuais = new Map(atual.adicionais.map((a) => [a.ingredientId, a]));
    const idsDesejados = new Set(desejados.map((a) => a.ingredientId));

    const novos = desejados.filter((a) => !atuais.has(a.ingredientId));

    if (novos.length > 0) {
        await unwrap(
            api.product.productsProductIdAdditionalIngredientsPost(
                atual.id,
                novos.map(paraAdicionalRequest)
            )
        );
    }

    for (const desejado of desejados) {
        const existente = atuais.get(desejado.ingredientId);

        if (
            existente &&
            (existente.maximo !== desejado.maximo || existente.status !== desejado.status)
        ) {
            await unwrap(
                api.product.productsProductIdAdditionalIngredientsAdditionalIngredientIdPut(
                    existente.id,
                    atual.id,
                    paraAdicionalRequest(desejado)
                )
            );
        }
    }

    for (const existente of atual.adicionais) {
        if (!idsDesejados.has(existente.ingredientId)) {
            await unwrapVoid(
                api.product.productsProductIdAdditionalIngredientsAdditionalIngredientIdDelete(
                    existente.id,
                    atual.id
                )
            );
        }
    }
}

export async function alterarStatusProduto(
    produto: Produto,
    status: ProdutoStatus
): Promise<void> {
    await unwrap(
        api.product.productsIdPut(produto.id, {
            name: produto.name,
            description: produto.description || undefined,
            imageUrl: produto.imageUrl ?? undefined,
            status,
        })
    );
}

export async function excluirProduto(id: number): Promise<void> {
    await unwrapVoid(api.product.productsIdDelete(id));
}

/** Combos e promoções que dependem do produto (para decidir o que mais inativar). */
export async function buscarDependentesProduto(
    id: number
): Promise<ProdutoDependentes> {
    const dependentes = await unwrap(
        api.product.productsIdDependentsGet(id)
    );

    return {
        combos: (dependentes?.combos ?? []).map((c) => c.name ?? ""),
        promocoes: (dependentes?.promotions ?? []).map((p) => p.title ?? ""),
    };
}
