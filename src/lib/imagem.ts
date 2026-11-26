export const TIPOS_DE_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

export const TAMANHO_MAXIMO_IMAGEM = 4 * 1024 * 1024;

const BLOB_PRIVADO = /^https:\/\/[^/]+\.private\.blob\.vercel-storage\.com\//i;

export function urlDeImagem(src: string | null | undefined): string | null {
    if (!src) {
        return null;
    }

    if (BLOB_PRIVADO.test(src)) {
        return `/api/imagem?url=${encodeURIComponent(src)}`;
    }

    return /^https?:\/\//i.test(src) || /^data:image\//i.test(src) || src.startsWith("/")
        ? src
        : null;
}

export function validarImagem(arquivo: File): string | null {
    if (!TIPOS_DE_IMAGEM.includes(arquivo.type)) {
        return "Formato não suportado. Envie uma imagem JPG, PNG ou WebP.";
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
        return "A imagem é grande demais. O limite é de 4 MB.";
    }

    return null;
}
