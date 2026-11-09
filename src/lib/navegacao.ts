import type { Me } from "@/src/lib/auth";
import type { Permissao } from "@/src/services/cargos";

/**
 * Páginas da sidebar, agrupadas em módulos.
 *
 * Um item sem `permissao` aparece para todos. Com `permissao`, só aparece para quem a tem
 * (ou é super admin). Um módulo sem nenhum item visível não aparece.
 *
 * As permissões batem com as que o backend exige em cada página: por exemplo, combos
 * dependem de "Promoções" (MANAGE_PROMOTIONS), não de "Produtos".
 */

export interface ItemNavegacao {
    label: string;
    href: string;
    permissao?: Permissao;
    /** Só a própria URL conta (ex.: "/admin" não deve casar com "/admin/configuracoes/..."). */
    exato?: boolean;
}

export interface ModuloNavegacao {
    titulo: string;
    itens: ItemNavegacao[];
}

export const MODULOS: ModuloNavegacao[] = [
    {
        titulo: "Operação",
        itens: [
            { label: "Pedidos", href: "/admin", permissao: "MANAGE_ORDERS", exato: true },
            { label: "Histórico", href: "/admin/historico", permissao: "MANAGE_ORDERS" },
        ],
    },
    {
        titulo: "Loja",
        itens: [
            { label: "Ver produtos", href: "/menu" },
            { label: "Carrinho", href: "/carrinho" },
            { label: "Meus pedidos", href: "/pedidos" },
        ],
    },
    {
        titulo: "Cardápio",
        itens: [
            {
                label: "Produtos",
                href: "/admin/configuracoes/produtos",
                permissao: "MANAGE_PRODUCTS",
            },
            {
                label: "Ingredientes",
                href: "/admin/configuracoes/ingredientes",
                permissao: "MANAGE_INGREDIENTS",
            },
            {
                label: "Combos",
                href: "/admin/configuracoes/combos",
                permissao: "MANAGE_PROMOTIONS",
            },
        ],
    },
    {
        titulo: "Equipe",
        itens: [
            {
                label: "Usuários internos",
                href: "/admin/configuracoes/usuarios",
                permissao: "MANAGE_USERS",
            },
            {
                label: "Cargos e permissões",
                href: "/admin/configuracoes/permissoes",
                permissao: "MANAGE_ROLES",
            },
        ],
    },
];

export function temPermissao(me: Me | null, permissao: Permissao): boolean {
    if (!me || me.type !== "INTERNAL") {
        return false;
    }

    return me.superAdmin || me.permissions.includes(permissao);
}

export function podeAcessar(me: Me | null, item: ItemNavegacao): boolean {
    return item.permissao ? temPermissao(me, item.permissao) : true;
}

/** Módulos com só os itens que o usuário pode ver; módulos vazios saem. */
export function modulosVisiveis(me: Me | null): ModuloNavegacao[] {
    return MODULOS.map((modulo) => ({
        ...modulo,
        itens: modulo.itens.filter((item) => podeAcessar(me, item)),
    })).filter((modulo) => modulo.itens.length > 0);
}

/**
 * Item da navegação que corresponde à URL (inclui subpáginas, ex.: /produtos/123).
 * Se mais de um casar, vale o de href mais longo (o mais específico).
 */
export function itemDaRota(pathname: string): ItemNavegacao | undefined {
    return MODULOS.flatMap((modulo) => modulo.itens)
        .filter(
            (item) =>
                pathname === item.href ||
                (!item.exato && pathname.startsWith(`${item.href}/`))
        )
        .sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * Caminho para onde voltar depois do login (o `?voltar=` da URL). Só aceita caminhos deste
 * site: "//outro.site" ou "https://..." viraria um redirecionamento para fora.
 */
export function caminhoDeVolta(valor: unknown): string | null {
    if (
        typeof valor !== "string" ||
        !valor.startsWith("/") ||
        valor.startsWith("//") ||
        valor.startsWith("/\\") ||
        valor.startsWith("/login") ||
        valor.startsWith("/cadastro")
    ) {
        return null;
    }

    return valor;
}

/** Link para uma tela de acesso (login ou cadastro) que, depois, volta para `voltar`. */
export function linkDeAcesso(tela: "/login" | "/cadastro", voltar: string | null): string {
    const destino = caminhoDeVolta(voltar);

    return destino ? `${tela}?voltar=${encodeURIComponent(destino)}` : tela;
}

/** Para onde levar o usuário depois do login. */
export function destinoAposLogin(me: Me): string {
    const primeiraRestrita = MODULOS.flatMap((modulo) => modulo.itens).find(
        (item) => item.permissao && podeAcessar(me, item)
    );

    return primeiraRestrita?.href ?? "/menu";
}
