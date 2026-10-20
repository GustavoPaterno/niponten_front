/**
 * Proxy do backend (nippon-ten): /backend/* -> BACKEND_URL/*.
 *
 * Existe no lugar do rewrite do next.config.ts porque o navegador manda o header Origin em todo
 * POST/PUT/DELETE (mesmo na mesma origem) e o rewrite o repassa. O backend só aceita no CORS as
 * origens de FRONT_ORIGINS e responde 403 para qualquer outra, o que quebrava login e cadastro.
 * Aqui a chamada ao backend sai do servidor do Next, sem Origin, então não há checagem de CORS.
 */

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// Cabeçalhos que não devem ser repassados ao backend.
const NAO_REPASSAR_REQUEST = new Set([
    "host",
    "origin",
    "referer",
    "connection",
    "content-length",
]);

// O fetch já descomprime o corpo, então estes cabeçalhos da resposta deixam de valer.
const NAO_REPASSAR_RESPONSE = new Set([
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
]);

async function repassar(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const destino = `${BACKEND_URL}${url.pathname.replace(/^\/backend/, "")}${url.search}`;

    const headers = new Headers();
    request.headers.forEach((valor, nome) => {
        if (!NAO_REPASSAR_REQUEST.has(nome.toLowerCase())) {
            headers.set(nome, valor);
        }
    });

    const temCorpo = request.method !== "GET" && request.method !== "HEAD";

    let resposta: Response;

    try {
        resposta = await fetch(destino, {
            method: request.method,
            headers,
            body: temCorpo ? await request.arrayBuffer() : undefined,
            redirect: "manual",
        });
    } catch {
        return Response.json(
            { message: "Backend indisponível." },
            { status: 502 }
        );
    }

    const respostaHeaders = new Headers();
    resposta.headers.forEach((valor, nome) => {
        const chave = nome.toLowerCase();

        if (chave !== "set-cookie" && !NAO_REPASSAR_RESPONSE.has(chave)) {
            respostaHeaders.set(nome, valor);
        }
    });
    // Set-Cookie pode vir várias vezes: precisa ser repassado um a um.
    for (const cookie of resposta.headers.getSetCookie()) {
        respostaHeaders.append("set-cookie", cookie);
    }

    return new Response(
        [204, 205, 304].includes(resposta.status) ? null : resposta.body,
        {
            status: resposta.status,
            statusText: resposta.statusText,
            headers: respostaHeaders,
        }
    );
}

export {
    repassar as GET,
    repassar as POST,
    repassar as PUT,
    repassar as PATCH,
    repassar as DELETE,
    repassar as HEAD,
};
