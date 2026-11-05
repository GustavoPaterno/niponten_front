import type { SizeResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas } from "@/src/lib/http";

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
    const lista = await unwrapTodas((page, size) => api.size.sizesGet(page, size));

    return (lista ?? []).map(toTamanho);
}

export async function criarTamanho(name: string): Promise<Tamanho> {
    const criado = await unwrap(
        api.size.sizesPost({ name: name.trim() })
    );

    return toTamanho(criado as SizeResponse);
}
