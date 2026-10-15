/**
 * Tratamento padrão das respostas do SDK (nippon-ten-api-client).
 *
 * O SDK não lança exceção em erro HTTP: devolve { data, error, response }. Aqui isso é
 * convertido em exceção (ApiError) com uma mensagem em português pronta para exibir.
 */

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

interface SdkResult<T> {
    data?: T;
    error?: unknown;
    response?: Response;
}

const ENTIDADES: Record<string, string> = {
    Product: "produto",
    Ingredient: "ingrediente",
    Combo: "combo",
    Size: "tamanho",
};

// Mensagens conhecidas do backend (em inglês) -> português.
const TRADUCOES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [
        /^Product \d+ cannot be deleted: used by (\d+) combo\(s\) and (\d+) promotion\(s\)/,
        (m) =>
            `Este produto não pode ser excluído: está em uso por ${m[1]} combo(s) e ${m[2]} promoção(ões).`,
    ],
    [
        /^Ingredient \d+ cannot be deleted: used by (\d+) product ingredient\(s\) and (\d+) additional ingredient\(s\)/,
        (m) =>
            `Este ingrediente não pode ser excluído: está em uso por ${m[1]} produto(s) e ${m[2]} adicional(is).`,
    ],
    [
        /^Combo \d+ must keep at least (\d+) products/,
        (m) => `Um combo precisa ter no mínimo ${m[1]} produtos.`,
    ],
    [
        /^Product \d+ must keep at least one size/,
        () => "O produto precisa ter pelo menos um tamanho.",
    ],
    [
        /^Product must have at least one size/,
        () => "O produto precisa ter pelo menos um tamanho.",
    ],
    [
        /^Combo endDate must be after startDate/,
        () => "A data de fim precisa ser posterior à data de início.",
    ],
    [
        /^Duplicated (ingredient|size) in product/,
        (m) =>
            m[1] === "size"
                ? "Há um tamanho repetido neste produto."
                : "Há um ingrediente repetido neste produto.",
    ],
    [
        /^Product \d+ already has size \d+/,
        () => "Este tamanho já foi adicionado ao produto.",
    ],
];

function mensagemDoCorpo(error: unknown): string | null {
    if (typeof error === "string" && error.trim()) {
        return error;
    }

    if (error && typeof error === "object") {
        const corpo = error as {
            message?: unknown;
            title?: unknown;
            violations?: Array<{ field?: string; message?: string }>;
        };

        // ErrorResponse do backend: { message }
        if (typeof corpo.message === "string") {
            return corpo.message;
        }

        // Bean Validation do Quarkus: { title, violations: [{ field, message }] }
        if (Array.isArray(corpo.violations) && corpo.violations.length > 0) {
            return corpo.violations
                .map((v) => v.message)
                .filter(Boolean)
                .join("; ");
        }
    }

    return null;
}

function traduzir(mensagem: string): string {
    for (const [padrao, converter] of TRADUCOES) {
        const match = mensagem.match(padrao);

        if (match) {
            return converter(match);
        }
    }

    return mensagem;
}

export function criarApiError(status: number, error: unknown): ApiError {
    const mensagem = mensagemDoCorpo(error);

    if (status === 404) {
        const entidade = mensagem?.split(/[ :]/)[0];
        const nome = entidade ? ENTIDADES[entidade] : undefined;

        return new ApiError(
            404,
            nome
                ? `Este ${nome} não foi encontrado. Ele pode ter sido removido: atualize a lista.`
                : "Registro não encontrado. Ele pode ter sido removido: atualize a lista."
        );
    }

    if (status === 400 && mensagem) {
        return new ApiError(400, traduzir(mensagem));
    }

    if (status >= 500) {
        return new ApiError(
            status,
            "O servidor encontrou um erro. Tente novamente em instantes."
        );
    }

    return new ApiError(
        status,
        mensagem ? traduzir(mensagem) : `Erro inesperado (${status}).`
    );
}

async function executar<T>(
    requisicao: PromiseLike<SdkResult<T>>
): Promise<SdkResult<T>> {
    let resultado: SdkResult<T>;

    try {
        resultado = await requisicao;
    } catch {
        throw new ApiError(
            0,
            "Não foi possível conectar ao servidor. Verifique se o backend está no ar."
        );
    }

    const status = resultado.response?.status ?? 0;

    if (resultado.error !== undefined || (resultado.response && !resultado.response.ok)) {
        throw criarApiError(status, resultado.error);
    }

    return resultado;
}

/** Aguarda uma chamada do SDK que devolve conteúdo e retorna só o `data`. */
export async function unwrap<T>(
    requisicao: PromiseLike<SdkResult<T>>
): Promise<T> {
    const resultado = await executar(requisicao);

    return resultado.data as T;
}

/** Aguarda uma chamada do SDK sem conteúdo de retorno (ex.: DELETE 204). */
export async function unwrapVoid(
    requisicao: PromiseLike<SdkResult<unknown>>
): Promise<void> {
    await executar(requisicao);
}

/** Mensagem pronta para exibir ao usuário a partir de qualquer erro capturado. */
export function mensagemDeErro(erro: unknown): string {
    if (erro instanceof ApiError) {
        return erro.message;
    }

    return "Ocorreu um erro inesperado. Tente novamente.";
}
