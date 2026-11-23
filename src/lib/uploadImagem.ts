import { ApiError } from "@/src/lib/http";
import { validarImagem } from "@/src/lib/imagem";

export interface ImagemEscolha {
    arquivo: File | null;
    remover: boolean;
}

export const SEM_ALTERACAO: ImagemEscolha = { arquivo: null, remover: false };

export async function enviarImagem(arquivo: File): Promise<string> {
    const invalida = validarImagem(arquivo);

    if (invalida) {
        throw new ApiError(400, invalida);
    }

    const formData = new FormData();

    formData.append("file", arquivo);

    let resposta: Response;

    try {
        resposta = await fetch("/api/upload", { method: "POST", body: formData });
    } catch {
        throw new ApiError(0, "Não foi possível enviar a imagem. Verifique sua conexão.");
    }

    const dados = (await resposta.json().catch(() => null)) as {
        url?: string;
        error?: string;
    } | null;

    if (!resposta.ok || !dados?.url) {
        throw new ApiError(
            resposta.status,
            dados?.error ?? "Não foi possível enviar a imagem. Tente novamente."
        );
    }

    return dados.url;
}

export async function apagarImagem(url: string | null | undefined): Promise<void> {
    if (!url) {
        return;
    }

        await fetch("/api/upload", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
}

export async function aplicarImagem<T>(
    atual: string | null,
    escolha: ImagemEscolha,
    gravar: (imageUrl: string | null) => Promise<T>,
    urlSalva?: (resposta: T) => string | null | undefined
): Promise<T> {
    if (!escolha.arquivo && !escolha.remover) {
        return gravar(atual);
    }

    const nova = escolha.arquivo ? await enviarImagem(escolha.arquivo) : null;

    let resposta: T;

    try {
        resposta = await gravar(nova);
    } catch (erro) {
        await apagarImagem(nova);

        throw erro;
    }

    const gravada = urlSalva?.(resposta);

    if (atual && atual !== nova && gravada !== atual) {
        await apagarImagem(atual);
    }

    return resposta;
}
