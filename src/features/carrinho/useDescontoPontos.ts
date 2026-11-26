"use client";

import { useEffect, useState } from "react";

import type { Me } from "@/src/lib/auth";
import { usePontosDoCarrinho, type ItemCarrinho } from "@/src/lib/carrinho";
import { mensagemDeErro } from "@/src/lib/http";
import { maximoDePontos } from "@/src/lib/limitePontos";
import { cotarPedido, type CotacaoPedido, type EntregaCotacao } from "@/src/services/cotacao";
import { buscarConfiguracaoPontos, buscarSaldo } from "@/src/services/pontos";

// Espera depois da última mudança antes de recotar (ex.: vários cliques no +).
const ESPERA_COTACAO_MS = 300;

export type SituacaoPontos =
    | { tipo: "visitante" }
    /** Conta da equipe: o backend só aceita pontos em pedido de cliente. */
    | { tipo: "equipe" }
    | { tipo: "carregando" }
    | { tipo: "erro"; mensagem: string }
    | { tipo: "pronto"; saldo: number; valorDoPonto: number; maximo: number };

// `para`/`pontos`/`entrega`/`versao` dizem para qual escolha o resultado vale: se mudou, está velho.
interface CotacaoGuardada {
    para: ItemCarrinho[];
    pontos: number;
    /** Chave da entrega cotada (ver `chaveEntrega`). */
    entrega: string;
    versao: number;
    cotacao: CotacaoPedido | null;
    erro: string | null;
}

/**
 * Desconto com pontos do carrinho, usado pelo carrinho (onde se escolhe) e pelo checkout.
 *
 * Quem calcula desconto, total e pontos a ganhar é o backend (/orders/quote).
 *
 * @param ativo `false` suspende as cotações (ex.: carrinho com item recusado).
 * @param entrega No checkout: tipo e endereço, para a cotação trazer a taxa de entrega.
 */
export function useDescontoPontos(
    itens: ItemCarrinho[],
    me: Me | null,
    ativo: boolean,
    entrega: EntregaCotacao | null = null
) {
    // Texto em vez do objeto: o checkout recria o objeto a cada render.
    const chaveEntrega = JSON.stringify(entrega);
    const cliente = me?.type === "CLIENT";
    const userId = me?.userId;
    const escolhidos = usePontosDoCarrinho();

    // Muda para buscar preços e saldo de novo.
    const [versao, setVersao] = useState(0);
    const [base, setBase] = useState<CotacaoGuardada | null>(null);
    const [comDesconto, setComDesconto] = useState<CotacaoGuardada | null>(null);
    const [carteira, setCarteira] = useState<{
        versao: number;
        dados: { saldo: number; valorDoPonto: number } | null;
        erro: string | null;
    } | null>(null);

    // Saldo e valor do ponto.
    useEffect(() => {
        if (!cliente || userId === undefined) {
            return;
        }

        let cancelado = false;

        Promise.all([buscarSaldo(userId), buscarConfiguracaoPontos()])
            .then(([saldo, configuracao]) => {
                if (!cancelado) {
                    setCarteira({
                        versao,
                        dados: { saldo: saldo.saldo, valorDoPonto: configuracao.pointValue },
                        erro: null,
                    });
                }
            })
            .catch((e) => {
                if (!cancelado) {
                    setCarteira({ versao, dados: null, erro: mensagemDeErro(e) });
                }
            });

        return () => {
            cancelado = true;
        };
    }, [cliente, userId, versao]);

    // Preço oficial sem desconto: dá o subtotal elegível, que limita os pontos.
    useEffect(() => {
        if (!ativo || itens.length === 0) {
            return;
        }

        let cancelado = false;
        const marca = { para: itens, pontos: 0, entrega: chaveEntrega, versao };
        const timer = setTimeout(() => {
            cotarPedido(itens, 0, JSON.parse(chaveEntrega) as EntregaCotacao | null)
                .then((cotacao) => {
                    if (!cancelado) {
                        setBase({ ...marca, cotacao, erro: null });
                    }
                })
                .catch((e) => {
                    if (!cancelado) {
                        setBase({ ...marca, cotacao: null, erro: mensagemDeErro(e) });
                    }
                });
        }, ESPERA_COTACAO_MS);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
    }, [ativo, itens, chaveEntrega, versao]);

    const baseAtual =
        ativo && base && base.para === itens && base.entrega === chaveEntrega && base.versao === versao
            ? base
            : null;
    const carteiraAtual = carteira?.versao === versao ? carteira : null;

    const maximo =
        baseAtual?.cotacao && carteiraAtual?.dados
            ? maximoDePontos({
                  saldo: carteiraAtual.dados.saldo,
                  valorDoPonto: carteiraAtual.dados.valorDoPonto,
                  subtotalElegivel: baseAtual.cotacao.subtotalElegivel,
              })
            : 0;
    // Se o máximo diminuir (carrinho ou saldo mudou), a escolha acompanha.
    const pontos = cliente ? Math.min(escolhidos, maximo) : 0;

    useEffect(() => {
        if (!ativo || pontos === 0) {
            return;
        }

        let cancelado = false;
        const marca = { para: itens, pontos, entrega: chaveEntrega, versao };
        const timer = setTimeout(() => {
            cotarPedido(itens, pontos, JSON.parse(chaveEntrega) as EntregaCotacao | null)
                .then((cotacao) => {
                    if (!cancelado) {
                        setComDesconto({ ...marca, cotacao, erro: null });
                    }
                })
                .catch((e) => {
                    if (!cancelado) {
                        setComDesconto({ ...marca, cotacao: null, erro: mensagemDeErro(e) });
                    }
                });
        }, ESPERA_COTACAO_MS);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
    }, [ativo, itens, pontos, chaveEntrega, versao]);

    const descontoAtual =
        comDesconto &&
        comDesconto.para === itens &&
        comDesconto.pontos === pontos &&
        comDesconto.entrega === chaveEntrega &&
        comDesconto.versao === versao
            ? comDesconto
            : null;

    // Há pontos escolhidos, mas ainda não dá para saber quantos valem: não mostrar o total cheio.
    const resolvendo = cliente && escolhidos > 0 && !(baseAtual?.cotacao && carteiraAtual?.dados);
    const vigente = resolvendo ? null : pontos === 0 ? baseAtual : descontoAtual;
    const erroCotacao = resolvendo
        ? (baseAtual?.erro ?? carteiraAtual?.erro ?? null)
        : (vigente?.erro ?? null);

    const situacao: SituacaoPontos = !me
        ? { tipo: "visitante" }
        : !cliente
          ? { tipo: "equipe" }
          : carteiraAtual?.erro || baseAtual?.erro
            ? { tipo: "erro", mensagem: carteiraAtual?.erro ?? baseAtual?.erro ?? "" }
            : carteiraAtual?.dados && baseAtual?.cotacao
              ? { tipo: "pronto", ...carteiraAtual.dados, maximo }
              : { tipo: "carregando" };

    return {
        /** Pontos que valem para este pedido (já dentro do máximo). */
        pontos,
        situacao,
        /** Valores do backend para a escolha atual. `null` = calculando ou falhou. */
        cotacao: vigente?.cotacao ?? null,
        erroCotacao,
        recarregar: () => setVersao((v) => v + 1),
    };
}
