/**
 * Só aceita URL absoluta (http/https) ou caminho local ("/images/..."). Qualquer outro valor
 * (ex.: "string", que veio de testes no Swagger) faz o next/image quebrar a página inteira.
 */
export function urlDeImagem(src: string | null | undefined): string | null {
    if (!src) {
        return null;
    }

    return /^https?:\/\//i.test(src) || src.startsWith("/") ? src : null;
}
