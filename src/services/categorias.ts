import type { CategoryResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas, unwrapVoid } from "@/src/lib/http";

/** Categoria do cardápio (Pastéis, Sucos, Pizzas...). `ordem` define a ordem das seções, menor primeiro. */
export interface Categoria {
    id: number;
    name: string;
    ordem: number;
}

/** Categoria com quantos produtos ela tem, para a tela de gestão. */
export interface CategoriaComProdutos extends Categoria {
    produtos: number;
}

export interface CategoriaInput {
    name: string;
    ordem: number;
}

function toCategoria(response: CategoryResponse): Categoria {
    return {
        id: response.id as number,
        name: response.name ?? "",
        ordem: response.displayOrder ?? 0,
    };
}

/** Todas as categorias, já na ordem do cardápio (o backend devolve ordenado). */
export async function listarCategorias(): Promise<Categoria[]> {
    const lista = await unwrapTodas((page, size) => api.category.categoriesGet(page, size));

    return (lista ?? []).map(toCategoria);
}

/** Categorias com a contagem de produtos: uma categoria com produtos não pode ser excluída. */
export async function listarCategoriasComProdutos(): Promise<CategoriaComProdutos[]> {
    const [categorias, produtos] = await Promise.all([
        listarCategorias(),
        unwrapTodas((page, size) => api.product.productsGet(page, size)),
    ]);

    const contagem = new Map<number, number>();

    for (const produto of produtos ?? []) {
        if (produto.categoryId != null) {
            contagem.set(produto.categoryId, (contagem.get(produto.categoryId) ?? 0) + 1);
        }
    }

    return categorias.map((c) => ({ ...c, produtos: contagem.get(c.id) ?? 0 }));
}

export async function criarCategoria(input: CategoriaInput): Promise<Categoria> {
    const criada = await unwrap(
        api.category.categoriesPost({ name: input.name.trim(), displayOrder: input.ordem })
    );

    return toCategoria(criada);
}

export async function atualizarCategoria(id: number, input: CategoriaInput): Promise<Categoria> {
    const atualizada = await unwrap(
        api.category.categoriesIdPut(id, { name: input.name.trim(), displayOrder: input.ordem })
    );

    return toCategoria(atualizada);
}

export async function excluirCategoria(id: number): Promise<void> {
    await unwrapVoid(api.category.categoriesIdDelete(id));
}
