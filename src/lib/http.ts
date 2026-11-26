/**
 * Tratamento padrão das respostas do SDK (nippon-ten, gerado com typescript-axios).
 *
 * O axios lança exceção em erro HTTP (com `response`) e em falha de rede (sem `response`).
 * Aqui isso é convertido em ApiError, com uma mensagem em português pronta para exibir.
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
    data: T;
}

const ENTIDADES: Record<string, string> = {
    Product: "produto",
    Ingredient: "ingrediente",
    Combo: "combo",
    Size: "tamanho",
};

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
        /^Not enough points: (\d+) requested, (\d+) available/,
        (m) => `Saldo insuficiente: foram pedidos ${m[1]} pontos, mas há ${m[2]} disponíveis.`,
    ],
    [
        /^points must not be zero/,
        () => "A quantidade de pontos não pode ser zero.",
    ],
    [
        /^Not allowed to access user/,
        () => "Você não tem permissão para ver os dados deste cliente.",
    ],
    [
        /^Email already registered/,
        () => "Este e-mail já está cadastrado. Tente entrar ou use outro e-mail.",
    ],
    [
        /^No default internal role configured/,
        () => "Escolha um cargo para o usuário (não há cargo padrão configurado).",
    ],
    [
        /^Product \d+ already has size \d+/,
        () => "Este tamanho já foi adicionado ao produto.",
    ],
    [
        /^cep (\S+) was not found/,
        (m) => `O CEP ${m[1]} não foi encontrado. Confira o número.`,
    ],
    [
        /must be a CEP like/,
        () => "CEP inválido: use 8 dígitos, como 01310-100.",
    ],
    [
        /^The address could not be located for delivery/,
        () => "Não encontramos este endereço para a entrega. Confira a rua, o número e o CEP.",
    ],
    [
        /^The store address could not be located/,
        () =>
            "Não encontramos o endereço da loja no mapa. Confira a rua, o número e o CEP, ou ajuste o pino no mapa.",
    ],
    [
        /^The delivery fee could not be calculated now/,
        () =>
            "Não foi possível calcular a taxa de entrega agora. Tente de novo em instantes ou escolha a retirada.",
    ],
    [
        /^The address is ([\d.]+) km away and the delivery reaches ([\d.]+) km/,
        (m) =>
            `Este endereço fica a ${km(m[1])} da loja e a entrega vai até ${km(m[2])}. Escolha outro endereço ou a retirada.`,
    ],
    [
        /^Two tiers share maxDistanceKm ([\d.]+)/,
        (m) => `Há duas faixas com a mesma distância (${km(m[1])}).`,
    ],
];

/** "22.25" -> "22,25 km" */
function km(valor: string): string {
    return `${Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
}

const CAMPOS: Record<string, string> = {
    name: "Nome",
    lastName: "Sobrenome",
    cpf: "CPF",
    email: "E-mail",
    password: "Senha",
    price: "Preço",
    permissions: "Permissões",
    cep: "CEP",
    streetAddress: "Rua",
    number: "Número",
    latitude: "Latitude do pino",
    longitude: "Longitude do pino",
    tiers: "Faixas",
    maxDistanceKm: "Distância",
    fee: "Taxa",
};

function nomeDoCampo(field: string | undefined): string | null {
    const ultimo = field?.split(".").pop();

    return ultimo ? (CAMPOS[ultimo] ?? null) : null;
}

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

        if (typeof corpo.message === "string") {
            return corpo.message;
        }

        if (Array.isArray(corpo.violations) && corpo.violations.length > 0) {
            return corpo.violations
                .filter((v) => v.message)
                .map((v) => {
                    const nome = nomeDoCampo(v.field);

                    return nome ? `${nome}: ${v.message}` : v.message;
                })
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

    // 502 com corpo: o backend respondeu, mas o serviço de CEP ou de mapa dele está fora do ar.
    if (status === 502 && mensagem?.startsWith("Address lookup unavailable")) {
        return new ApiError(
            502,
            "A consulta de endereço está indisponível agora. Tente novamente em instantes."
        );
    }

    // 502: o proxy /backend não alcançou o backend (fora do ar).
    if (status === 502) {
        return new ApiError(
            502,
            "Não foi possível conectar ao servidor. Tente novamente em instantes."
        );
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
    try {
        return await requisicao;
    } catch (erro) {
        const resposta = (erro as { response?: { status: number; data: unknown } })
            .response;

        if (!resposta) {
            throw new ApiError(
                0,
                "Não foi possível conectar ao servidor. Verifique se o backend está no ar."
            );
        }

        throw criarApiError(resposta.status, resposta.data);
    }
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

interface Pagina<T> {
    content?: T[];
    totalPages?: number;
}

// O backend devolve no máximo 100 itens por página.
const TAMANHO_PAGINA = 100;

/**
 * Busca todas as páginas de uma listagem paginada do backend e junta os itens.
 * A primeira página diz quantas existem; as demais são buscadas em paralelo.
 *
 * Uso: `unwrapTodas((page, size) => api.product.productsGet(page, size))`
 */
export async function unwrapTodas<T>(
    buscarPagina: (page: number, size: number) => PromiseLike<SdkResult<Pagina<T>>>
): Promise<T[]> {
    const primeira = await unwrap(buscarPagina(0, TAMANHO_PAGINA));
    const totalPaginas = primeira?.totalPages ?? 1;

    if (totalPaginas <= 1) {
        return primeira?.content ?? [];
    }

    const resto = await Promise.all(
        Array.from({ length: totalPaginas - 1 }, (_, i) =>
            unwrap(buscarPagina(i + 1, TAMANHO_PAGINA))
        )
    );

    return [primeira, ...resto].flatMap((pagina) => pagina?.content ?? []);
}

/** Mensagem pronta para exibir ao usuário a partir de qualquer erro capturado. */
export function mensagemDeErro(erro: unknown): string {
    if (erro instanceof ApiError) {
        return erro.message;
    }

    return "Ocorreu um erro inesperado. Tente novamente.";
}
