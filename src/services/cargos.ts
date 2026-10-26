import type { InternalPermission, InternalRoleResponse } from "nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap } from "@/src/lib/http";

export type Permissao = InternalPermission;

/** Permissões do painel, na ordem em que aparecem na tela. */
export const PERMISSOES: { valor: Permissao; label: string }[] = [
    { valor: "MANAGE_USERS", label: "Usuários" },
    { valor: "MANAGE_ROLES", label: "Cargos" },
    { valor: "MANAGE_PRODUCTS", label: "Produtos" },
    { valor: "MANAGE_INGREDIENTS", label: "Ingredientes" },
    { valor: "MANAGE_PROMOTIONS", label: "Promoções" },
];

export function labelPermissao(permissao: Permissao): string {
    return PERMISSOES.find((p) => p.valor === permissao)?.label ?? permissao;
}

/** Mantém a ordem de PERMISSOES, sem repetir. */
export function ordenarPermissoes(lista: Permissao[]): Permissao[] {
    return PERMISSOES.map((p) => p.valor).filter((p) => lista.includes(p));
}

export interface Cargo {
    id: number;
    name: string;
    /** Nome pronto para exibir ("super_admin" -> "Super admin"). */
    label: string;
    active: boolean;
    /** Cargo que o backend usa quando nenhum é informado. */
    padrao: boolean;
    /** Cargo do sistema (ex.: super_admin): não pode ser editado nem desativado. */
    reservado: boolean;
}

/**
 * Atenção: o backend não devolve as permissões de um cargo (nem na lista nem no detalhe).
 * Elas só são enviadas ao criar ou editar, e a edição substitui todas.
 */
export interface CargoInput {
    name: string;
    permissions: Permissao[];
    padrao: boolean;
}

/** "super_admin" -> "Super admin" */
function formatarNome(nome: string): string {
    const texto = nome.replace(/_/g, " ").trim();

    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function toCargo(response: InternalRoleResponse): Cargo {
    // `reserved` vem do backend, mas ainda não está no tipo gerado do SDK.
    const reservado = (response as { reserved?: boolean }).reserved ?? false;

    return {
        id: response.id as number,
        name: response.name ?? "",
        label: formatarNome(response.name ?? ""),
        active: response.active ?? true,
        padrao: response.defaultRole ?? false,
        reservado,
    };
}

export async function listarCargos(): Promise<Cargo[]> {
    const lista = await unwrap(api.internalRole.internalRolesGet());

    return (lista ?? []).map(toCargo);
}

function toRequest(input: CargoInput) {
    return {
        name: input.name.trim(),
        permissions: ordenarPermissoes(input.permissions),
        defaultRole: input.padrao,
    };
}

export async function criarCargo(input: CargoInput): Promise<void> {
    await unwrap(api.internalRole.internalRolesPost(toRequest(input)));
}

export async function atualizarCargo(
    atual: Cargo,
    input: CargoInput
): Promise<void> {
    await unwrap(api.internalRole.internalRolesIdPut(atual.id, toRequest(input)));
}

export async function alterarStatusCargo(
    cargo: Cargo,
    ativo: boolean
): Promise<void> {
    await unwrap(
        ativo
            ? api.internalRole.internalRolesIdActivatePost(cargo.id)
            : api.internalRole.internalRolesIdDeactivatePost(cargo.id)
    );
}
