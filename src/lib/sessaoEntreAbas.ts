/**
 * Aviso de troca de conta entre as abas do mesmo navegador.
 *
 * O login fica num cookie só (ver src/lib/auth.ts), compartilhado por todas as abas. Entrar com
 * outra conta numa aba troca o token das outras também, mas cada aba guarda o seu `me` em memória:
 * sem o aviso, uma aba de cliente continuaria mostrando pontos e endereços salvos enquanto o proxy
 * já manda o token de outra conta, e o backend recusa ("pointsToRedeem requires a client login").
 */

const CANAL = "marusan.sessao";

function abrirCanal(): BroadcastChannel | null {
    return typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(CANAL);
}

/** Avisa as outras abas que a sessão mudou (login ou logout). A aba que avisa não recebe. */
export function avisarTrocaDeSessao(): void {
    const canal = abrirCanal();
    canal?.postMessage("trocou");
    canal?.close();
}

/** Chama `aoTrocar` quando outra aba avisar. Devolve a função que para de ouvir. */
export function ouvirTrocaDeSessao(aoTrocar: () => void): () => void {
    const canal = abrirCanal();

    if (!canal) {
        return () => {};
    }

    canal.onmessage = aoTrocar;

    return () => canal.close();
}
