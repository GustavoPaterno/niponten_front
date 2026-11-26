import type { DeliverySettingsResponse, StoreAddressResponse } from "@joao.sumi/nippon-ten";

import { api } from "@/src/lib/api";
import { ApiError, unwrap } from "@/src/lib/http";

/**
 * Taxa de entrega por distância e consulta de CEP.
 *
 * A taxa é calculada pelo backend: distância em linha reta entre a loja e o endereço, cobrada
 * em faixas ("até 3 km, R$ 5"). A maior faixa é o raio de entrega; fora dele, o delivery é
 * recusado. O front nunca envia taxa nem coordenada do cliente.
 *
 * A loja é cadastrada pelo endereço, e o backend acha a coordenada. O pino no mapa só é enviado
 * quando o admin o ajusta à mão: a coordenada que vem do Google não pode ser gravada (termos do
 * Google), então ela nunca volta no corpo do PUT.
 *
 * Permissões: ler a configuração e consultar CEP são públicos; alterar e localizar a loja exigem
 * MANAGE_DELIVERY.
 */

/** Limite do backend. */
export const MAXIMO_FAIXAS = 20;

export interface FaixaEntrega {
    /** Fim da faixa, em km. */
    ateKm: number;
    /** Em reais. */
    taxa: number;
}

export interface Posicao {
    lat: number;
    lng: number;
}

/** O que o admin digita. */
export interface EnderecoLojaInput {
    rua: string;
    numero: string;
    complemento: string | null;
    cep: string;
}

/** Com bairro, cidade e UF, que o backend completa pelo CEP. */
export interface EnderecoLoja extends EnderecoLojaInput {
    bairro: string | null;
    cidade: string | null;
    uf: string | null;
}

export interface ConfiguracaoEntrega {
    /** `false` até alguém informar a loja: a taxa fica 0. */
    ativa: boolean;
    /** `null` na configuração antiga, feita só com coordenadas. */
    endereco: EnderecoLoja | null;
    /** De onde a distância é medida. `null` se o Google estiver fora do ar. */
    posicao: Posicao | null;
    /** `true` quando a posição é o pino posto à mão; `false`, a do endereço. */
    pinoFixado: boolean;
    /** Em ordem crescente de distância. */
    faixas: FaixaEntrega[];
    /** Raio de entrega (a maior faixa). */
    raioKm: number | null;
    atualizadaEm: string | null;
}

export interface ConfiguracaoEntregaInput {
    endereco: EnderecoLojaInput;
    /** Só o pino ajustado à mão; `null` para usar a posição do endereço. */
    pino: Posicao | null;
    faixas: FaixaEntrega[];
}

function toEnderecoLoja(e: StoreAddressResponse): EnderecoLoja {
    return {
        rua: e.streetAddress ?? "",
        numero: e.number ?? "",
        complemento: e.complement ?? null,
        cep: e.cep ?? "",
        bairro: e.neighborhood ?? null,
        cidade: e.city ?? null,
        uf: e.state ?? null,
    };
}

function toPosicao(p: { latitude?: number; longitude?: number } | undefined | null): Posicao | null {
    return p?.latitude == null || p.longitude == null ? null : { lat: p.latitude, lng: p.longitude };
}

function toConfiguracao(resposta: DeliverySettingsResponse): ConfiguracaoEntrega {
    return {
        ativa: resposta.enabled ?? false,
        endereco: resposta.storeAddress ? toEnderecoLoja(resposta.storeAddress) : null,
        posicao: toPosicao(resposta.storeLocation),
        pinoFixado: resposta.storeLocationPinned ?? false,
        faixas: (resposta.tiers ?? [])
            .map((t) => ({ ateKm: t.maxDistanceKm ?? 0, taxa: t.fee ?? 0 }))
            .sort((a, b) => a.ateKm - b.ateKm),
        raioKm: resposta.maxDistanceKm ?? null,
        atualizadaEm: resposta.updatedAt ?? null,
    };
}

function toStoreAddress(e: EnderecoLojaInput) {
    return {
        streetAddress: e.rua.trim(),
        number: e.numero.trim(),
        cep: e.cep.trim(),
        complement: e.complemento?.trim() || undefined,
    };
}

export async function buscarConfiguracaoEntrega(): Promise<ConfiguracaoEntrega> {
    return toConfiguracao(await unwrap(api.delivery.deliverySettingsGet()));
}

/** Substitui todas as faixas. Vale só para pedidos novos. */
export async function salvarConfiguracaoEntrega(
    input: ConfiguracaoEntregaInput
): Promise<ConfiguracaoEntrega> {
    const salva = await unwrap(
        api.delivery.deliverySettingsPut({
            storeAddress: toStoreAddress(input.endereco),
            pinnedLocation: input.pino ? { latitude: input.pino.lat, longitude: input.pino.lng } : undefined,
            tiers: input.faixas.map((f) => ({ maxDistanceKm: f.ateKm, fee: f.taxa })),
        })
    );

    return toConfiguracao(salva);
}

export interface LojaLocalizada {
    endereco: EnderecoLoja;
    /** `null` quando o Google não achou o endereço com precisão de rua: o admin põe o pino. */
    posicao: Posicao | null;
}

/**
 * Acha a loja no mapa sem salvar nada. CEP inexistente é ApiError 400; Google fora do ar,
 * ApiError 502.
 */
export async function localizarLoja(endereco: EnderecoLojaInput): Promise<LojaLocalizada> {
    const r = await unwrap(api.delivery.deliverySettingsGeocodePost(toStoreAddress(endereco)));

    return {
        endereco: toEnderecoLoja(r.address ?? {}),
        posicao: toPosicao(r.location),
    };
}

export interface EnderecoDoCep {
    cep: string;
    /** `null` no CEP único de cidade pequena: aí o cliente digita a rua. */
    rua: string | null;
    bairro: string | null;
    cidade: string;
    uf: string;
}

/**
 * Rua, bairro, cidade e UF de um CEP (com ou sem hífen). `null` quando o CEP não existe.
 * Lança ApiError se a consulta estiver fora do ar.
 */
export async function buscarCep(cep: string): Promise<EnderecoDoCep | null> {
    try {
        const r = await unwrap(api.address.addressesCepCepGet(cep.replace(/\D/g, "")));

        return {
            cep: r.cep ?? cep,
            rua: r.street?.trim() || null,
            bairro: r.neighborhood?.trim() || null,
            cidade: r.city ?? "",
            uf: r.state ?? "",
        };
    } catch (erro) {
        if (erro instanceof ApiError && (erro.status === 404 || erro.status === 400)) {
            return null;
        }

        throw erro;
    }
}

/** "Centro, São Carlos/SP" (partes ausentes ficam de fora). */
export function localidade(e: {
    bairro?: string | null;
    cidade?: string | null;
    uf?: string | null;
}): string {
    const cidade = [e.cidade, e.uf].filter(Boolean).join("/");

    return [e.bairro, cidade].filter(Boolean).join(", ");
}

/** 3.2 -> "3,2 km" */
export function formatarKm(km: number): string {
    return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
}
