import { api } from "@/src/lib/api";
import { unwrap } from "@/src/lib/http";

import {
    labelPermissao,
    listarCargos,
    ordenarPermissoes,
    type Permissao,
} from "./cargos";

export interface UsuarioInterno {
    id: number;
    userId: number;
    name: string;
    lastName: string;
    email: string;
    cpf: string;
    internalRoleId: number | null;
    permissions: Permissao[];
    active: boolean;

    nomeCompleto: string;
    cargo: string;
    permissoesTexto: string;
}

export interface UsuarioInternoInput {
    name: string;
    lastName: string;
    /** Só dígitos (11). */
    cpf: string;
    internalRoleId: number | null;
    permissions: Permissao[];
}

/** Na criação também são definidos o e-mail e a senha de login. */
export interface NovoUsuarioInternoInput extends UsuarioInternoInput {
    email: string;
    password: string;
}

export async function listarUsuariosInternos(): Promise<UsuarioInterno[]> {
    const [internos, usuarios, cargos] = await Promise.all([
        unwrap(api.internal.internalGet()),
        unwrap(api.user.usersGet()),
        listarCargos().catch(() => []),
    ]);

    const contas = new Map(
        (usuarios ?? []).map((u) => [u.id as number, u])
    );
    const nomesCargos = new Map(cargos.map((c) => [c.id, c.label]));

    return (internos ?? []).map((interno) => {
        const conta = contas.get(interno.userId as number);
        const permissions = interno.userPermissions ?? [];
        const internalRoleId = interno.internalRoleId ?? null;
        const name = interno.name ?? "";
        const lastName = interno.lastName ?? "";

        return {
            id: interno.id as number,
            userId: interno.userId as number,
            name,
            lastName,
            email: conta?.email ?? "",
            cpf: interno.cpf ?? "",
            internalRoleId,
            permissions,
            active: conta?.active ?? true,
            nomeCompleto: `${name} ${lastName}`.trim(),
            cargo:
                internalRoleId !== null
                    ? (nomesCargos.get(internalRoleId) ?? "—")
                    : "—",
            permissoesTexto: permissions.map(labelPermissao).join(", "),
        };
    });
}

function toRequest(input: UsuarioInternoInput) {
    return {
        name: input.name.trim(),
        lastName: input.lastName.trim(),
        cpf: input.cpf,
        internalRoleId: input.internalRoleId ?? undefined,
        userPermissions: ordenarPermissoes(input.permissions),
    };
}

export async function criarUsuarioInterno(
    input: NovoUsuarioInternoInput
): Promise<void> {
    await unwrap(
        api.internal.internalPost({
            user: { email: input.email.trim(), password: input.password },
            internal: toRequest(input),
        })
    );
}

/** Altera só os dados internos. E-mail e senha não mudam por aqui. */
export async function atualizarUsuarioInterno(
    atual: UsuarioInterno,
    input: UsuarioInternoInput
): Promise<void> {
    await unwrap(api.internal.internalIdPut(atual.id, toRequest(input)));
}

/** Ativa ou desativa a conta de login. Conta desativada não consegue entrar. */
export async function alterarStatusUsuarioInterno(
    usuario: UsuarioInterno,
    ativo: boolean
): Promise<void> {
    await unwrap(
        ativo
            ? api.user.usersIdActivatePost(usuario.userId)
            : api.user.usersIdDeactivatePost(usuario.userId)
    );
}
