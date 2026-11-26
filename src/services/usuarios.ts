import { userApi } from "@/src/lib/nippon";
import { ApiError, criarApiError, unwrap } from "@/src/lib/http";
import { api } from "@/src/lib/api";

export interface CadastroInput {
    name: string;
    lastName: string;
    email: string;
    password: string;
    /** Com DDD; a equipe usa para falar com o cliente sobre o pedido. */
    phone: string;
}

/** POST /users: cria o usuário já como cliente (é a única conta que o cadastro público cria). */
export async function cadastrarCliente(input: CadastroInput): Promise<void> {
    try {
        await userApi.usersPost({
            user: { email: input.email.trim(), password: input.password },
            client: {
                name: input.name.trim(),
                lastName: input.lastName.trim(),
                phone: input.phone.trim(),
            },
        });
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

/** Telefone da conta do cliente logado; vazio nas contas criadas antes de o cadastro pedir. */
export async function telefoneDaConta(userId: number): Promise<string> {
    const dados = await unwrap(api.user.usersUserIdClientGet(userId));

    return dados.phone?.trim() ?? "";
}

/** Grava o telefone na conta, mantendo nome, sobrenome e CPF. */
export async function salvarTelefoneDaConta(userId: number, telefone: string): Promise<void> {
    const dados = await unwrap(api.user.usersUserIdClientGet(userId));

    await unwrap(
        api.user.usersUserIdClientPut(userId, {
            name: dados.name ?? "",
            lastName: dados.lastName ?? "",
            cpf: dados.cpf || undefined,
            phone: telefone.trim(),
        })
    );
}
