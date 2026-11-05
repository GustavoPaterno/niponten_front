import { api } from "@/src/lib/api";
import { ApiError, unwrap, unwrapTodas } from "@/src/lib/http";

/**
 * Dados da tela de detalhes (/menu/produto/[id]): produto, produto em promoção ou combo.
 * Tudo público no backend. `null` quando o item existe mas não está disponível para pedir.
 */

export interface TamanhoDetalhe {
    /** Id da associação produto + tamanho, que vai no pedido. */
    productSizeId: number;
    nome: string;
    preco: number;
    /** Preço sem desconto, quando o tamanho está na promoção. */
    precoOriginal: number | null;
}

export interface IngredienteDetalhe {
    ingredientId: number;
    nome: string;
}

export interface AdicionalDetalhe extends IngredienteDetalhe {
    preco: number;
    esgotado: boolean;
}

export interface DetalheProduto {
    tipo: "PRODUCT";
    id: number;
    nome: string;
    descricao: string;
    imagem: string | null;
    tamanhos: TamanhoDetalhe[];
    /** Ingredientes que vêm no produto (o cliente pode remover). */
    ingredientes: IngredienteDetalhe[];
    /** Todos os ingredientes cadastrados, oferecidos como adicionais. */
    adicionais: AdicionalDetalhe[];
    promocao: { id: number; titulo: string; desconto: number } | null;
}

export interface ItemDoCombo {
    nome: string;
    tamanho: string | null;
    quantidade: number;
}

export interface DetalheCombo {
    tipo: "COMBO";
    id: number;
    nome: string;
    descricao: string;
    imagem: string | null;
    preco: number;
    validoAte: string | null;
    itens: ItemDoCombo[];
}

export type DetalheItem = DetalheProduto | DetalheCombo;

/** LocalDateTime do backend ("2026-11-05T10:00:00") comparado com agora, no horário local. */
function dentroDoPeriodo(inicio?: string | null, fim?: string | null): boolean {
    const agora = Date.now();

    if (inicio && new Date(inicio).getTime() > agora) {
        return false;
    }

    return !(fim && new Date(fim).getTime() < agora);
}

/** 404 vira "não encontrado" (null); outros erros sobem para a tela mostrar. */
async function ouNulo<T>(promessa: Promise<T>): Promise<T | null> {
    try {
        return await promessa;
    } catch (erro) {
        if (erro instanceof ApiError && erro.status === 404) {
            return null;
        }

        throw erro;
    }
}

export async function buscarDetalheProduto(
    id: number,
    promocaoId: number | null
): Promise<DetalheProduto | null> {
    const [produto, tamanhos, ingredientes, promocao] = await Promise.all([
        ouNulo(unwrap(api.product.productsIdGet(id))),
        unwrapTodas((page, size) => api.size.sizesGet(page, size)),
        unwrapTodas((page, size) => api.ingredient.ingredientsGet(page, size)),
        promocaoId ? ouNulo(unwrap(api.promotion.promotionsIdGet(promocaoId))) : null,
    ]);

    if (!produto || produto.status !== "ACTIVE") {
        return null;
    }

    const nomesTamanho = new Map(tamanhos.map((t) => [t.id as number, t.name ?? ""]));
    const porIngrediente = new Map(ingredientes.map((i) => [i.id as number, i]));

    // A promoção só vale se for deste produto, estiver ativa e dentro do período.
    const promocaoValida =
        promocao &&
        promocao.status === "ACTIVE" &&
        promocao.productId === id &&
        dentroDoPeriodo(promocao.startDate, promocao.endDate)
            ? promocao
            : null;
    const precosPromo = new Map(
        (promocaoValida?.prices ?? []).map((p) => [p.productSizeId as number, p])
    );

    const listaTamanhos: TamanhoDetalhe[] = (produto.sizes ?? [])
        .filter((t) => t.status === "ACTIVE")
        .map((t) => {
            const promo = precosPromo.get(t.id as number);

            return {
                productSizeId: t.id as number,
                nome: nomesTamanho.get(t.sizeId as number) ?? "Tamanho único",
                preco: promo?.promotionalPrice ?? t.price ?? 0,
                precoOriginal: promo ? (promo.originalPrice ?? t.price ?? null) : null,
            };
        })
        .sort((a, b) => a.preco - b.preco);

    if (listaTamanhos.length === 0) {
        return null;
    }

    const maiorDesconto = listaTamanhos.reduce((maior, t) => {
        if (!t.precoOriginal) {
            return maior;
        }

        return Math.max(maior, Math.round((1 - t.preco / t.precoOriginal) * 100));
    }, 0);

    return {
        tipo: "PRODUCT",
        id,
        nome: produto.name ?? "",
        descricao: produto.description ?? "",
        imagem: produto.imageUrl || null,
        tamanhos: listaTamanhos,
        ingredientes: (produto.ingredients ?? [])
            .map((pi) => porIngrediente.get(pi.ingredientId as number))
            .filter((i) => i !== undefined)
            .map((i) => ({ ingredientId: i.id as number, nome: i.name ?? "" })),
        adicionais: ingredientes
            .map((i) => ({
                ingredientId: i.id as number,
                nome: i.name ?? "",
                preco: i.price ?? 0,
                esgotado: i.status !== "ACTIVE",
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
        promocao: promocaoValida
            ? {
                  id: promocaoValida.id as number,
                  titulo: promocaoValida.title ?? "",
                  desconto: maiorDesconto,
              }
            : null,
    };
}

export async function buscarDetalheCombo(id: number): Promise<DetalheCombo | null> {
    const combo = await ouNulo(unwrap(api.combo.combosIdGet(id)));

    if (!combo || combo.status !== "ACTIVE" || !dentroDoPeriodo(combo.startDate, combo.endDate)) {
        return null;
    }

    const [associacoes, tamanhos] = await Promise.all([
        unwrap(api.combo.combosComboIdProductsGet(id)),
        unwrapTodas((page, size) => api.size.sizesGet(page, size)),
    ]);
    const nomesTamanho = new Map(tamanhos.map((t) => [t.id as number, t.name ?? ""]));

    const itens = await Promise.all(
        (associacoes ?? []).map(async (a) => {
            const produto = await ouNulo(unwrap(api.product.productsIdGet(a.productId as number)));
            const tamanho = produto?.sizes?.find((t) => t.id === a.productSizeId);

            return {
                nome: produto?.name ?? "Produto",
                tamanho: tamanho ? (nomesTamanho.get(tamanho.sizeId as number) ?? null) : null,
                quantidade: a.quantity ?? 1,
            };
        })
    );

    return {
        tipo: "COMBO",
        id,
        nome: combo.name ?? "",
        descricao: combo.description ?? "",
        imagem: combo.imageUrl || null,
        preco: combo.price ?? 0,
        validoAte: combo.endDate ?? null,
        itens,
    };
}
