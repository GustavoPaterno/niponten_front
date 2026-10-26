import type { IngredientResponse } from "nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapVoid } from "@/src/lib/http";

export type IngredienteStatus = "ACTIVE" | "OUT_OF_STOCK";

export interface Ingrediente {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    price: number;
    status: IngredienteStatus;
}

export interface IngredienteInput {
    name: string;
    description: string;
    price: number;
    status: IngredienteStatus;
}

export interface IngredienteDependentes {
    produtos: string[];
    produtosAdicionais: string[];
}

export function toIngrediente(response: IngredientResponse): Ingrediente {
    return {
        id: response.id as number,
        name: response.name ?? "",
        description: response.description ?? "",
        imageUrl: response.imageUrl ?? null,
        price: response.price ?? 0,
        status: response.status ?? "ACTIVE",
    };
}

function toRequest(input: IngredienteInput, imageUrl: string | null) {
    return {
        name: input.name.trim(),
        description: input.description.trim() || undefined,
        // Imagens ficam para uma próxima etapa: só preservamos a que já existe.
        imageUrl: imageUrl ?? undefined,
        price: input.price,
        status: input.status,
    };
}

export async function listarIngredientes(): Promise<Ingrediente[]> {
    const lista = await unwrap(api.ingredient.ingredientsGet());

    return (lista ?? []).map(toIngrediente);
}

export async function criarIngrediente(
    input: IngredienteInput
): Promise<Ingrediente> {
    const criado = await unwrap(
        api.ingredient.ingredientsPost(toRequest(input, null))
    );

    // O OpenAPI não declara o corpo da resposta 201, então o SDK o tipa como unknown.
    return toIngrediente(criado as IngredientResponse);
}

export async function atualizarIngrediente(
    ingrediente: Ingrediente,
    input: IngredienteInput
): Promise<Ingrediente> {
    const atualizado = await unwrap(
        api.ingredient.ingredientsIdPut(
            ingrediente.id,
            toRequest(input, ingrediente.imageUrl)
        )
    );

    return toIngrediente(atualizado);
}

export function alterarStatusIngrediente(
    ingrediente: Ingrediente,
    status: IngredienteStatus
): Promise<Ingrediente> {
    return atualizarIngrediente(ingrediente, {
        name: ingrediente.name,
        description: ingrediente.description,
        price: ingrediente.price,
        status,
    });
}

export async function excluirIngrediente(id: number): Promise<void> {
    await unwrapVoid(api.ingredient.ingredientsIdDelete(id));
}

/** Quem usa este ingrediente: serve para o usuário decidir o que também marcar como esgotado. */
export async function buscarDependentesIngrediente(
    id: number
): Promise<IngredienteDependentes> {
    const dependentes = await unwrap(
        api.ingredient.ingredientsIdDependentsGet(id)
    );

    return {
        produtos: (dependentes?.products ?? []).map((p) => p.name ?? ""),
        produtosAdicionais: (dependentes?.additionalProducts ?? []).map(
            (p) => p.name ?? ""
        ),
    };
}
