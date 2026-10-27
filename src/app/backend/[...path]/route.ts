const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

const TOKEN_COOKIE = "marusan_token";
const REFRESH_COOKIE = "nt_refresh";
const CSRF_HEADER = ["X-Requested-With", "nippon-ten"] as const;

const SEGURO = process.env.NODE_ENV === "production";

const NAO_REPASSAR_REQUEST = new Set([
    "host",
    "origin",
    "referer",
    "connection",
    "content-length",
]);

const NAO_REPASSAR_RESPONSE = new Set([
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
]);

interface TokenResponse {
    accessToken?: string;
    expiresIn?: number;
}

function lerCookie(request: Request, nome: string): string | null {
    const cookies = request.headers.get("cookie") ?? "";

    for (const parte of cookies.split(";")) {
        const [chave, ...valor] = parte.trim().split("=");

        if (chave === nome) {
            return decodeURIComponent(valor.join("="));
        }
    }

    return null;
}

function cookieDoToken(token: string, expiresIn: number | undefined): string {
    const partes = [
        `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
    ];

    if (expiresIn && expiresIn > 0) {
        partes.push(`Max-Age=${Math.floor(expiresIn)}`);
    }

    if (SEGURO) {
        partes.push("Secure");
    }

    return partes.join("; ");
}

function apagarCookieDoToken(): string {
    return `${TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/**
 * Ajusta os cookies do backend para o navegador:
 * - Path passa a ser /backend, para o cookie voltar em toda chamada ao proxy (o refresh
 *   automático acontece em qualquer rota, não só em /backend/auth).
 * - Domain é removido, porque o cookie pertence à origem do front.
 */
function ajustarCookieDoBackend(cookie: string): string {
    const partes = cookie
        .split(";")
        .map((p) => p.trim())
        .filter((p) => !/^(path|domain)=/i.test(p));

    partes.push("Path=/backend");

    return partes.join("; ");
}

function montarHeaders(request: Request, token: string | null): Headers {
    const headers = new Headers();

    request.headers.forEach((valor, nome) => {
        if (!NAO_REPASSAR_REQUEST.has(nome.toLowerCase())) {
            headers.set(nome, valor);
        }
    });

    if (token && !headers.has("authorization")) {
        headers.set("authorization", `Bearer ${token}`);
    }

    return headers;
}

interface Renovacao {
    token: string | null;
    setCookies: string[];
}

const RENOVACOES = new Map<string, Promise<Renovacao>>();
const REAPROVEITAR_MS = 30_000;

/** Chama /auth/refresh com o cookie nt_refresh do navegador. */
function renovarToken(request: Request): Promise<Renovacao> {
    const refresh = lerCookie(request, REFRESH_COOKIE);

    if (!refresh) {
        return Promise.resolve({ token: null, setCookies: [] });
    }

    const emAndamento = RENOVACOES.get(refresh);

    if (emAndamento) {
        return emAndamento;
    }

    const renovacao = chamarRefresh(refresh);
    RENOVACOES.set(refresh, renovacao);
    setTimeout(() => RENOVACOES.delete(refresh), REAPROVEITAR_MS);

    return renovacao;
}

async function chamarRefresh(refresh: string): Promise<Renovacao> {
    let resposta: Response;

    try {
        resposta = await fetch(`${BACKEND_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                [CSRF_HEADER[0]]: CSRF_HEADER[1],
                cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}`,
            },
        });
    } catch {
        return { token: null, setCookies: [] };
    }

    const setCookies = resposta.headers
        .getSetCookie()
        .map(ajustarCookieDoBackend);

    if (!resposta.ok) {
        return { token: null, setCookies: [...setCookies, apagarCookieDoToken()] };
    }

    const corpo = (await resposta.json().catch(() => ({}))) as TokenResponse;

    if (!corpo.accessToken) {
        return { token: null, setCookies: [...setCookies, apagarCookieDoToken()] };
    }

    return {
        token: corpo.accessToken,
        setCookies: [...setCookies, cookieDoToken(corpo.accessToken, corpo.expiresIn)],
    };
}

/** Repassa a resposta do backend, com os Set-Cookie ajustados e os extras do proxy. */
async function responder(
    resposta: Response,
    caminho: string,
    extras: string[]
): Promise<Response> {
    const headers = new Headers();
    resposta.headers.forEach((valor, nome) => {
        const chave = nome.toLowerCase();

        if (chave !== "set-cookie" && !NAO_REPASSAR_RESPONSE.has(chave)) {
            headers.set(nome, valor);
        }
    });

    const setCookies = [
        ...resposta.headers.getSetCookie().map(ajustarCookieDoBackend),
        ...extras,
    ];

    let corpo: BodyInit | null = [204, 205, 304].includes(resposta.status)
        ? null
        : resposta.body;

    const emitiuToken = caminho === "/auth/login" || caminho === "/auth/refresh";

    if (emitiuToken && resposta.ok) {
        const json = (await resposta.json().catch(() => ({}))) as TokenResponse;

        if (json.accessToken) {
            setCookies.push(cookieDoToken(json.accessToken, json.expiresIn));
        }

        delete json.accessToken;
        corpo = JSON.stringify(json);
        headers.set("content-type", "application/json");
    }

    if (caminho === "/auth/logout") {
        setCookies.push(apagarCookieDoToken());
    }

    for (const cookie of setCookies) {
        headers.append("set-cookie", cookie);
    }

    return new Response(corpo, {
        status: resposta.status,
        statusText: resposta.statusText,
        headers,
    });
}

async function repassar(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const caminho = url.pathname.replace(/^\/backend/, "") || "/";
    const destino = `${BACKEND_URL}${caminho}${url.search}`;

    const temCorpo = request.method !== "GET" && request.method !== "HEAD";
    const corpo = temCorpo ? await request.arrayBuffer() : undefined;

    const rotaDeAuth = caminho.startsWith("/auth/") && caminho !== "/auth/me";
    const extras: string[] = [];

    let token = rotaDeAuth ? null : lerCookie(request, TOKEN_COOKIE);

    if (!rotaDeAuth && !token && lerCookie(request, REFRESH_COOKIE)) {
        const renovacao = await renovarToken(request);
        token = renovacao.token;
        extras.push(...renovacao.setCookies);
    }

    const chamar = (comToken: string | null) =>
        fetch(destino, {
            method: request.method,
            headers: montarHeaders(request, comToken),
            body: corpo,
            redirect: "manual",
        });

    let resposta: Response;

    try {
        resposta = await chamar(token);

        if (resposta.status === 401 && !rotaDeAuth && token) {
            const renovacao = await renovarToken(request);
            extras.push(...renovacao.setCookies);

            if (renovacao.token) {
                resposta = await chamar(renovacao.token);
            }
        }
    } catch {
        return Response.json(
            { message: "Backend indisponível." },
            { status: 502, headers: extras.map((c) => ["set-cookie", c]) }
        );
    }

    return responder(resposta, caminho, extras);
}

export {
    repassar as GET,
    repassar as POST,
    repassar as PUT,
    repassar as PATCH,
    repassar as DELETE,
    repassar as HEAD,
};
