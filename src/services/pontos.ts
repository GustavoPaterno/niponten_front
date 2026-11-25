import type {
    PointsSettingsResponse,
    PointsTransactionResponse,
} from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { unwrap, unwrapTodas } from "@/src/lib/http";

/**
 * Programa de pontos.
 *
 * Permissões que o backend exige:
 * - alterar e simular a configuração, e ajustar o saldo de um cliente: MANAGE_POINTS;
 * - listar clientes e ver saldo/extrato de outra pessoa: MANAGE_USERS.
 */

/** Tamanho máximo do motivo de um ajuste (limite do backend). */
export const MAXIMO_MOTIVO = 500;

export const ITENS_POR_PAGINA_EXTRATO = 10;

export interface ConfiguracaoPontos {
    /** Pontos ganhos a cada R$ 1 pago. 0 = o acúmulo está desligado. */
    earnRate: number;
    /** Quanto 1 ponto vale em reais no resgate. */
    pointValue: number;
    /** Dias até o ponto vencer. `null` = não vence. */
    expirationDays: number | null;
    updatedAt: string | null;
}

export type ConfiguracaoPontosInput = Omit<ConfiguracaoPontos, "updatedAt">;

/** Como uma compra fica quando o cliente usa o saldo que já tem. */
export interface CenarioCompra {
    /** Quanto do saldo é gasto nesta compra. */
    pontosUsados: number;
    /** Em reais. */
    desconto: number;
    /** Valor a pagar, em reais, já com o desconto. */
    total: number;
    /** Pontos que esta compra rende. Só valem para as próximas. */
    pontosGanhos: number;
}

export interface SimulacaoCompra {
    atual: CenarioCompra;
    proposta: CenarioCompra;
}

export interface ClientePontos {
    userId: number;
    email: string;
    active: boolean;
}

export interface SaldoPontos {
    saldo: number;
    /** Próximo lote a vencer. `null` quando nenhum ponto do saldo vence. */
    proximoVencimento: { pontos: number; data: string } | null;
}

export type TipoMovimento = NonNullable<PointsTransactionResponse["type"]>;

export interface MovimentoPontos {
    id: number;
    tipo: TipoMovimento;
    /** Com sinal: positivo entrou, negativo saiu. */
    pontos: number;
    pedidoId: number | null;
    motivo: string | null;
    venceEm: string | null;
    criadoEm: string | null;
}

export interface PaginaExtrato {
    movimentos: MovimentoPontos[];
    totalPaginas: number;
    total: number;
}

function toConfiguracao(response: PointsSettingsResponse): ConfiguracaoPontos {
    return {
        earnRate: response.earnRate ?? 0,
        pointValue: response.pointValue ?? 0,
        expirationDays: response.expirationDays ?? null,
        updatedAt: response.updatedAt ?? null,
    };
}

export async function buscarConfiguracaoPontos(): Promise<ConfiguracaoPontos> {
    return toConfiguracao(await unwrap(api.points.pointsSettingsGet()));
}

/** Vale só para pedidos novos: cada pedido guarda a taxa do próprio checkout. */
export async function salvarConfiguracaoPontos(
    input: ConfiguracaoPontosInput
): Promise<ConfiguracaoPontos> {
    const salva = await unwrap(
        api.points.pointsSettingsPut({
            earnRate: input.earnRate,
            pointValue: input.pointValue,
            // Ausente = os pontos não vencem.
            expirationDays: input.expirationDays ?? undefined,
        })
    );

    return toConfiguracao(salva);
}

/**
 * Mesma regra do checkout: o desconto é pontos × valor do ponto e não passa do valor da compra
 * (o que não couber continua no saldo). Conta em centavos para não sobrar resto.
 */
function aplicarSaldo(compra: number, saldo: number, valorDoPonto: number) {
    const compraCentavos = Math.round(compra * 100);
    const pontoCentavos = Math.round(valorDoPonto * 100);
    const pontosUsados = Math.min(saldo, Math.floor(compraCentavos / pontoCentavos));
    const descontoCentavos = pontosUsados * pontoCentavos;

    return {
        pontosUsados,
        desconto: descontoCentavos / 100,
        total: (compraCentavos - descontoCentavos) / 100,
    };
}

/** Compara, sem gravar nada, a compra com a configuração salva e com a proposta. */
export async function simularCompra(input: {
    /** Valor dos itens, sem a entrega. */
    compra: number;
    /** Pontos que o cliente já tem antes desta compra. */
    saldo: number;
    valorDoPontoAtual: number;
    proposta: { earnRate: number; pointValue: number };
}): Promise<SimulacaoCompra> {
    const atual = aplicarSaldo(input.compra, input.saldo, input.valorDoPontoAtual);
    const proposta = aplicarSaldo(input.compra, input.saldo, input.proposta.pointValue);

    // Os pontos ganhos saem do valor pago, que muda de um cenário para o outro: uma consulta para cada.
    const consultar = (amount: number) =>
        unwrap(api.points.pointsSettingsSimulationPost({ ...input.proposta, amount }));
    const [impactoAtual, impactoProposta] = await Promise.all([
        consultar(atual.total),
        consultar(proposta.total),
    ]);

    return {
        atual: { ...atual, pontosGanhos: impactoAtual.current?.pointsEarned ?? 0 },
        proposta: { ...proposta, pontosGanhos: impactoProposta.proposed?.pointsEarned ?? 0 },
    };
}

/** Contas que não são da equipe: só clientes têm pontos. */
export async function listarClientesComConta(): Promise<ClientePontos[]> {
    const [usuarios, internos] = await Promise.all([
        unwrapTodas((page, size) => api.user.usersGet(page, size)),
        unwrapTodas((page, size) => api.internal.internalGet(page, size)),
    ]);

    const daEquipe = new Set((internos ?? []).map((i) => i.userId as number));

    return (usuarios ?? [])
        .filter((u) => !daEquipe.has(u.id as number))
        .map((u) => ({
            userId: u.id as number,
            email: u.email ?? "",
            active: u.active ?? true,
        }));
}

/** Nome completo do cliente, ou `null` se a conta não tem cadastro de cliente. */
export async function buscarNomeDoCliente(userId: number): Promise<string | null> {
    const detalhe = await unwrap(api.user.usersIdGet(userId));

    if (!detalhe.client) {
        return null;
    }

    return `${detalhe.client.name ?? ""} ${detalhe.client.lastName ?? ""}`.trim();
}

export async function buscarSaldo(userId: number): Promise<SaldoPontos> {
    const resposta = await unwrap(api.user.usersUserIdPointsGet(userId));
    const proximo = resposta.nextExpiration;

    return {
        saldo: resposta.balance ?? 0,
        proximoVencimento: proximo?.expiresAt
            ? { pontos: proximo.points ?? 0, data: proximo.expiresAt }
            : null,
    };
}

/** `pagina` começa em 0. */
export async function buscarExtrato(userId: number, pagina: number): Promise<PaginaExtrato> {
    const resposta = await unwrap(
        api.user.usersUserIdPointsTransactionsGet(userId, pagina, ITENS_POR_PAGINA_EXTRATO)
    );

    return {
        movimentos: (resposta.content ?? []).map((m) => ({
            id: m.id as number,
            tipo: m.type as TipoMovimento,
            pontos: m.points ?? 0,
            pedidoId: m.orderId ?? null,
            motivo: m.reason ?? null,
            venceEm: m.expiresAt ?? null,
            criadoEm: m.createdAt ?? null,
        })),
        totalPaginas: resposta.totalPages ?? 1,
        total: resposta.totalElements ?? 0,
    };
}

/** Correção manual: `pontos` positivo credita, negativo debita. */
export async function ajustarPontos(userId: number, pontos: number, motivo: string): Promise<void> {
    await unwrap(
        api.user.usersUserIdPointsAdjustmentsPost(userId, {
            points: pontos,
            reason: motivo.trim(),
        })
    );
}
