import { ApiError, criarApiError } from "@/src/lib/http";

export interface LoginInput {
    email: string;
    password: string;
}

export interface TokenResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
}

const TOKEN_KEY = "marusan.accessToken";
const TOKEN_EVENT = "marusan:auth-changed";

export async function login(input: LoginInput): Promise<TokenResponse> {
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
        throw new ApiError(
            0,
            "Não foi possível conectar ao servidor. Verifique se o backend está no ar."
        );
    }

    if (response.ok) {
        const token = (await response.json()) as TokenResponse;
        salvarToken(token.accessToken);

        return token;
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

export function obterToken(): string | null {
    try {
        return sessionStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function salvarToken(token: string): void {
    try {
        sessionStorage.setItem(TOKEN_KEY, token);
        window.dispatchEvent(new Event(TOKEN_EVENT));
    } catch {
        // sessionStorage indisponível: o token só vale para esta chamada.
    }
}

export function removerToken(): void {
    try {
        sessionStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event(TOKEN_EVENT));
    } catch {
        // nada a fazer
    }
}

/** Para useSyncExternalStore: avisa quando o token muda. */
export function assinarToken(callback: () => void): () => void {
    window.addEventListener(TOKEN_EVENT, callback);
    window.addEventListener("storage", callback);

    return () => {
        window.removeEventListener(TOKEN_EVENT, callback);
        window.removeEventListener("storage", callback);
    };
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
        response = await fetch("/backend/auth/me", {
            headers: { Authorization: `Bearer ${obterToken() ?? ""}` },
        });
    } catch {
        throw new ApiError(
            0,
            "Não foi possível conectar ao servidor. Verifique se o backend está no ar."
        );
    }

    if (!response.ok) {
        throw criarApiError(
            response.status,
            await response.json().catch(() => undefined)
        );
    }

    return (await response.json()) as Me;
}

export function destinoPorTipo(tipo: UserType): string {
    return tipo === "INTERNAL" ? "/admin/configuracoes" : "/menu";
}

export async function entrar(input: LoginInput): Promise<string> {
    await login(input);

    try {
        const me = await buscarMe();

        return destinoPorTipo(me.type);
    } catch (erro) {
        removerToken();
        throw erro;
    }
}
