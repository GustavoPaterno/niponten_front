import type { SizeResponse } from "nippon-ten-api-client";

import { api } from "@/src/lib/api";
import { unwrap } from "@/src/lib/http";

export interface Tamanho {
    id: number;
    name: string;
}

function toTamanho(response: SizeResponse): Tamanho {
    return {
        id: response.id as number,
        name: response.name ?? "",
    };
}

export async function listarTamanhos(): Promise<Tamanho[]> {
    const lista = await unwrap(api.size.getAll());

    return (lista ?? []).map(toTamanho);
}

export async function criarTamanho(name: string): Promise<Tamanho> {
    const criado = await unwrap(
        api.size.create({ body: { name: name.trim() } })
    );

    // O OpenAPI não declara o corpo da resposta 201, então o SDK o tipa como unknown.
    return toTamanho(criado as SizeResponse);
}
