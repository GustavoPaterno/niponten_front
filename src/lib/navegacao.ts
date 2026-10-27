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
}

export interface ModuloNavegacao {
    titulo: string;
    itens: ItemNavegacao[];
}

export const MODULOS: ModuloNavegacao[] = [
    {
        titulo: "Loja",
        itens: [
            { label: "Ver produtos", href: "/menu" },
            { label: "Carrinho", href: "/carrinho" },
            { label: "Perfil", href: "/perfil" },
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

/** Item da navegação que corresponde à URL (inclui subpáginas, ex.: /produtos/123). */
export function itemDaRota(pathname: string): ItemNavegacao | undefined {
    return MODULOS.flatMap((modulo) => modulo.itens).find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
}

/** Para onde levar o usuário depois do login. */
export function destinoAposLogin(me: Me): string {
    const primeiraRestrita = MODULOS.flatMap((modulo) => modulo.itens).find(
        (item) => item.permissao && podeAcessar(me, item)
    );

    return primeiraRestrita?.href ?? "/menu";
}
