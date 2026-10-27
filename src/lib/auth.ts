import { ApiError, criarApiError } from "@/src/lib/http";
import { destinoAposLogin } from "@/src/lib/navegacao";

/**
 * Autenticação.
 *
 * O token nunca chega ao JavaScript: o proxy em src/app/backend/[...path]/route.ts o guarda
 * num cookie httpOnly no login, envia como Authorization: Bearer em cada chamada ao backend
 * e o renova sozinho pelo /auth/refresh quando expira. Aqui só disparamos login e logout.
 */

export interface LoginInput {
    email: string;
    password: string;
}

/** Resposta do login vista pelo navegador (o accessToken é retirado pelo proxy). */
export interface LoginResponse {
    tokenType: string;
    expiresIn: number;
}

const ERRO_CONEXAO =
    "Não foi possível conectar ao servidor. Verifique se o backend está no ar.";

export async function login(input: LoginInput): Promise<LoginResponse> {
    let response: Response;

    try {
        response = await fetch("/backend/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email: input.email.trim(),
                password: input.password,
            }),
        });
    } catch {
        throw new ApiError(0, ERRO_CONEXAO);
    }

    if (response.ok) {
        return (await response.json()) as LoginResponse;
    }

    const corpo = await response.json().catch(() => undefined);

    if (response.status === 401) {
        throw new ApiError(401, "E-mail ou senha inválidos.");
    }

    if (response.status === 429) {
        throw new ApiError(
            429,
            "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
        );
    }

    throw criarApiError(response.status, corpo);
}

/**
 * Encerra a sessão: o backend invalida o refresh token e o proxy apaga o cookie do token.
 * Não lança erro: mesmo com o backend fora do ar, o usuário deve conseguir sair.
 */
export async function sair(): Promise<void> {
    try {
        await fetch("/backend/auth/logout", {
            method: "POST",
            headers: { "X-Requested-With": "nippon-ten" },
            credentials: "include",
        });
    } catch {
        // Sem conexão: não há o que fazer além de seguir para a tela de login.
    }
}

export type UserType = "CLIENT" | "INTERNAL";

export interface Me {
    userId: number;
    email: string;
    type: UserType;
    name: string | null;
    lastName: string | null;
    superAdmin: boolean;
    permissions: string[];
}

export async function buscarMe(): Promise<Me> {
    let response: Response;

    try {
        response = await fetch("/backend/auth/me", { credentials: "include" });
    } catch {
        throw new ApiError(0, ERRO_CONEXAO);
    }

    if (!response.ok) {
        throw criarApiError(
            response.status,
            await response.json().catch(() => undefined)
        );
    }

    return (await response.json()) as Me;
}

/** Faz login e devolve para onde levar o usuário (a primeira página que ele pode acessar). */
export async function entrar(input: LoginInput): Promise<string> {
    await login(input);

    try {
        const me = await buscarMe();

        return destinoAposLogin(me);
    } catch (erro) {
        await sair();
        throw erro;
    }
}
