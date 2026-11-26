import Link from "next/link";
import { Add, Remove } from "@mui/icons-material";
import { CircularProgress, IconButton } from "@mui/material";

import { definirPontosDoCarrinho } from "@/src/lib/carrinho";
import { formatCurrency } from "@/src/lib/format";
import { FRACAO_MAXIMA_DESCONTO_PONTOS } from "@/src/lib/limitePontos";
import { linkDeAcesso } from "@/src/lib/navegacao";

import type { SituacaoPontos } from "../useDescontoPontos";

interface PontosCarrinhoProps {
    situacao: SituacaoPontos;
    /** Pontos escolhidos (já dentro do máximo). */
    pontos: number;
    /** Há item recusado no carrinho: os pontos esperam o ajuste. */
    carrinhoComProblema: boolean;
    onTentarDeNovo: () => void;
}

function pontosPorExtenso(quantidade: number): string {
    return `${quantidade.toLocaleString("pt-BR")} ${quantidade === 1 ? "ponto" : "pontos"}`;
}

/** Linha "Pontos" do resumo do carrinho: o cliente escolhe quanto do saldo usar como desconto. */
export default function PontosCarrinho({
    situacao,
    pontos,
    carrinhoComProblema,
    onTentarDeNovo,
}: PontosCarrinhoProps) {
    return (
        <div className="flex flex-col gap-1.5 border-t border-black/10 pt-2.5">
            <div className="flex items-baseline justify-between gap-3">
                <span>Pontos</span>
                {situacao.tipo === "pronto" && (
                    <span className="text-xs text-tinta-suave">
                        Você tem {pontosPorExtenso(situacao.saldo)} ({formatCurrency(situacao.valorDoPonto)} cada)
                    </span>
                )}
            </div>

            {situacao.tipo === "visitante" && (
                <p className="text-xs text-tinta-suave">
                    <Link href={linkDeAcesso("/login", "/carrinho")} className="font-medium text-marca">
                        Entre na sua conta
                    </Link>{" "}
                    para usar seus pontos como desconto.
                </p>
            )}

            {situacao.tipo === "equipe" && (
                <p className="text-xs text-tinta-suave">
                    Contas da equipe não usam pontos. Entre com uma conta de cliente para ter desconto.
                </p>
            )}

            {situacao.tipo !== "visitante" && situacao.tipo !== "equipe" && carrinhoComProblema && (
                <p className="text-xs text-tinta-suave">Ajuste os itens com problema para usar pontos.</p>
            )}

            {situacao.tipo === "carregando" && !carrinhoComProblema && (
                <p className="flex items-center gap-2 text-xs text-tinta-suave">
                    <CircularProgress size={14} /> Conferindo seus pontos...
                </p>
            )}

            {situacao.tipo === "erro" && !carrinhoComProblema && (
                <p role="alert" className="text-xs text-erro">
                    Não foi possível carregar seus pontos. {situacao.mensagem}{" "}
                    <button type="button" onClick={onTentarDeNovo} className="cursor-pointer font-bold underline">
                        Tentar novamente
                    </button>
                </p>
            )}

            {situacao.tipo === "pronto" &&
                (situacao.maximo === 0 ? (
                    <p className="text-xs text-tinta-suave">
                        {situacao.saldo === 0
                            ? "Faça pedidos para juntar pontos."
                            : "Neste pedido não é possível usar pontos."}
                    </p>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-1">
                            <IconButton
                                size="small"
                                aria-label="Diminuir pontos"
                                disabled={pontos <= 0}
                                onClick={() => definirPontosDoCarrinho(pontos - 1)}
                            >
                                <Remove fontSize="small" />
                            </IconButton>

                            <input
                                aria-label="Pontos a usar"
                                inputMode="numeric"
                                value={String(pontos)}
                                onChange={(e) => {
                                    const digitos = e.target.value.replace(/\D/g, "");

                                    definirPontosDoCarrinho(Math.min(Number(digitos), situacao.maximo));
                                }}
                                onFocus={(e) => e.target.select()}
                                className="h-9 w-20 rounded-lg bg-chapa text-center tabular-nums text-tinta ring-1 ring-black/10 focus:outline-2 focus:outline-marca"
                            />

                            <IconButton
                                size="small"
                                aria-label="Aumentar pontos"
                                disabled={pontos >= situacao.maximo}
                                onClick={() => definirPontosDoCarrinho(pontos + 1)}
                            >
                                <Add fontSize="small" />
                            </IconButton>

                            <button
                                type="button"
                                onClick={() =>
                                    definirPontosDoCarrinho(pontos >= situacao.maximo ? 0 : situacao.maximo)
                                }
                                className="ml-auto cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold text-marca transition hover:bg-chapa"
                            >
                                {pontos >= situacao.maximo ? "Não usar" : "Usar máximo"}
                            </button>
                        </div>

                        {/* TEMPORÁRIO (50%): o texto acompanha a regra de src/lib/limitePontos.ts. */}
                        <p className="text-xs text-tinta-suave">
                            Até {pontosPorExtenso(situacao.maximo)}: o desconto vai no máximo a{" "}
                            {FRACAO_MAXIMA_DESCONTO_PONTOS * 100}% do valor dos produtos.
                        </p>
                    </>
                ))}
        </div>
    );
}
