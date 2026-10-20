import { userApi } from "@/src/lib/nippon";
import { ApiError, criarApiError } from "@/src/lib/http";

export interface CadastroInput {
    name: string;
    lastName: string;
    email: string;
    password: string;
}

/** POST /users: cria o usuário já como cliente (é a única conta que o cadastro público cria). */
export async function cadastrarCliente(input: CadastroInput): Promise<void> {
    try {
        await userApi.usersPost({
            user: { email: input.email.trim(), password: input.password },
            client: {
                name: input.name.trim(),
                lastName: input.lastName.trim(),
            },
        });
    } catch (erro) {
        // O client usa axios: erro HTTP lança uma exceção com `response`; sem `response` é falha de rede.
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
