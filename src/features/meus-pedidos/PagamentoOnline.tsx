"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircularProgress } from "@mui/material";
import { CheckCircle, ContentCopyOutlined, ErrorOutlined, HourglassTopOutlined } from "@mui/icons-material";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";

import { useToast } from "@/src/components/feedback/ToastProvider";
import { formatCurrency } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import type { MeuPedido } from "@/src/services/checkout";
import {
    PUBLIC_KEY_MERCADO_PAGO,
    gerarPix,
    listarPagamentos,
    motivoDaRecusa,
    pagamentoAtual,
    pagarComCartao,
    pixAberto,
    type PagamentoOnline as Pagamento,
} from "@/src/services/pagamento";

// Enquanto espera o pagamento, confere o status nesse intervalo, além dos eventos em tempo real.
const CONFERIR_MS = 4_000;

let mercadoPagoIniciado = false;

function iniciarMercadoPago() {
    if (!mercadoPagoIniciado && PUBLIC_KEY_MERCADO_PAGO) {
        initMercadoPago(PUBLIC_KEY_MERCADO_PAGO, { locale: "pt-BR" });
        mercadoPagoIniciado = true;
    }
}

function tempoRestante(expiraEm: string | null, agora: number): string | null {
    if (!expiraEm) {
        return null;
    }

    const segundos = Math.max(0, Math.floor((new Date(expiraEm).getTime() - agora) / 1000));
    const min = Math.floor(segundos / 60);
    const seg = String(segundos % 60).padStart(2, "0");

    return `${min}:${seg}`;
}

/**
 * Pagamento de um pedido online que ainda espera o pagamento (AWAITING_PAYMENT). Pix: mostra o QR
 * code e o copia e cola, e gera um novo se o anterior expirou. Cartão: formulário do Mercado Pago
 * (Card Payment Brick). Confere o status sozinho e avisa quando o pagamento é aprovado.
 */
export default function PagamentoOnline({
    pedido,
    gerarPixAoAbrir,
    onAprovado,
}: {
    pedido: MeuPedido;
    /** Gera o Pix sem esperar o clique, se ainda não houver um aberto (logo depois do checkout). */
    gerarPixAoAbrir: boolean;
    onAprovado: () => void;
}) {
    const toast = useToast();
    const [pagamentos, setPagamentos] = useState<Pagamento[] | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [agora, setAgora] = useState(() => Date.now());
    const geradoAutomatico = useRef(false);
    const avisouAprovacao = useRef(false);

    const atual = pagamentos ? pagamentoAtual(pagamentos) : null;
    const pix = pedido.metodo === "PIX";
    const aprovado = atual?.status === "APPROVED";

    const conferir = useCallback(async () => {
        try {
            const lista = await listarPagamentos(pedido.id, pedido.token);
            setPagamentos(lista);
            setErro(null);

            return lista;
        } catch (e) {
            setErro(mensagemDeErro(e));

            return null;
        }
    }, [pedido.id, pedido.token]);

    // Carga inicial e conferência periódica até aprovar.
    useEffect(() => {
        if (aprovado) {
            return;
        }

        const inicial = setTimeout(conferir, 0);
        const intervalo = setInterval(conferir, CONFERIR_MS);

        return () => {
            clearTimeout(inicial);
            clearInterval(intervalo);
        };
    }, [conferir, aprovado]);

    // Relógio do prazo do Pix.
    useEffect(() => {
        const relogio = setInterval(() => setAgora(Date.now()), 1000);

        return () => clearInterval(relogio);
    }, []);

    useEffect(() => {
        if (aprovado && !avisouAprovacao.current) {
            avisouAprovacao.current = true;
            toast.success(`Pagamento do pedido #${pedido.codigo} aprovado!`);
            onAprovado();
        }
    }, [aprovado, onAprovado, pedido.codigo, toast]);

    const novoPix = useCallback(async () => {
        setEnviando(true);
        setErro(null);

        try {
            const criado = await gerarPix(pedido.id, pedido.token);
            setPagamentos((lista) => [...(lista ?? []), criado]);
        } catch (e) {
            setErro(mensagemDeErro(e));
            // Pode ter sido criado por outra aba, ou o pedido mudou: atualiza.
            conferir();
        } finally {
            setEnviando(false);
        }
    }, [conferir, pedido.id, pedido.token]);

    // Logo depois do checkout, o QR code aparece sem mais um clique.
    useEffect(() => {
        if (!pix || !gerarPixAoAbrir || geradoAutomatico.current || pagamentos === null) {
            return;
        }

        geradoAutomatico.current = true;

        if (pagamentos.length === 0) {
            const t = setTimeout(novoPix, 0);

            return () => clearTimeout(t);
        }
    }, [gerarPixAoAbrir, novoPix, pagamentos, pix]);

    const copiar = async (texto: string) => {
        try {
            await navigator.clipboard.writeText(texto);
            toast.success("Código Pix copiado.");
        } catch {
            toast.error("Não foi possível copiar. Selecione o código e copie manualmente.");
        }
    };

    if (pagamentos === null) {
        return (
            <div className="flex justify-center py-4">
                {erro ? <p className="text-sm text-erro">{erro}</p> : <CircularProgress size={22} sx={{ color: "var(--primary)" }} />}
            </div>
        );
    }

    if (aprovado) {
        return (
            <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-semibold text-green-700">
                <CheckCircle fontSize="small" /> Pagamento aprovado. Seu pedido já foi para a cozinha.
            </p>
        );
    }

    const restante = tempoRestante(atual?.expiraEm ?? null, agora);
    const aberto = pixAberto(atual, agora);

    return (
        <section aria-label="Pagamento" className="flex flex-col gap-3 rounded-xl bg-chapa/60 p-3">
            <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display font-bold">{pix ? "Pague com Pix" : "Pague com cartão"}</h3>
                <span className="font-display font-extrabold tabular-nums">{formatCurrency(pedido.total)}</span>
            </div>

            {pix && aberto && atual && (
                <div className="flex flex-col items-center gap-3">
                    {atual.pixQrCodeBase64 && (
                        // eslint-disable-next-line @next/next/no-img-element -- imagem em data: URI, sem otimização possível
                        <img
                            src={`data:image/png;base64,${atual.pixQrCodeBase64}`}
                            alt="QR code do Pix"
                            className="h-48 w-48 rounded-lg bg-white p-2"
                        />
                    )}
                    <div className="flex w-full items-center gap-2">
                        <input
                            readOnly
                            value={atual.pixCopiaECola ?? ""}
                            aria-label="Código Pix copia e cola"
                            onFocus={(e) => e.currentTarget.select()}
                            className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs ring-1 ring-black/10"
                        />
                        <button
                            type="button"
                            onClick={() => copiar(atual.pixCopiaECola ?? "")}
                            className="flex shrink-0 items-center gap-1 rounded-full bg-marca px-3 py-2 text-xs font-semibold text-white"
                        >
                            <ContentCopyOutlined sx={{ fontSize: 16 }} /> Copiar
                        </button>
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-tinta-suave" aria-live="polite">
                        <HourglassTopOutlined sx={{ fontSize: 18 }} className="animate-pulse" />
                        Aguardando o pagamento{restante ? `, expira em ${restante}` : ""}. Esta tela atualiza sozinha.
                    </p>
                </div>
            )}

            {pix && !aberto && (
                <div className="flex flex-col items-start gap-2">
                    {atual && atual.status !== "PENDING" && (
                        <p className="flex items-center gap-1.5 text-sm text-tinta-suave">
                            <ErrorOutlined sx={{ fontSize: 18 }} />
                            {atual.status === "EXPIRED" || atual.expiraEm
                                ? "O Pix anterior expirou sem pagamento."
                                : "O Pix anterior não foi concluído."}
                        </p>
                    )}
                    {atual?.status === "PENDING" && (
                        <p className="text-sm text-tinta-suave">O Pix anterior expirou. Gere um novo para pagar.</p>
                    )}
                    <button
                        type="button"
                        disabled={enviando}
                        onClick={novoPix}
                        className="flex items-center gap-2 rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                        {enviando && <CircularProgress size={16} sx={{ color: "white" }} />}
                        {atual ? "Gerar novo Pix" : "Gerar Pix"}
                    </button>
                </div>
            )}

            {!pix && (
                <PagamentoCartao
                    pedido={pedido}
                    atual={atual}
                    onPago={(criado) => setPagamentos((lista) => [...(lista ?? []), criado])}
                />
            )}

            {erro && <p className="text-sm text-erro">{erro}</p>}
        </section>
    );
}

function PagamentoCartao({
    pedido,
    atual,
    onPago,
}: {
    pedido: MeuPedido;
    atual: Pagamento | null;
    onPago: (pagamento: Pagamento) => void;
}) {
    const [erro, setErro] = useState<string | null>(null);

    if (atual?.status === "PENDING") {
        return (
            <p className="flex items-center gap-1.5 text-sm text-tinta-suave" aria-live="polite">
                <HourglassTopOutlined sx={{ fontSize: 18 }} className="animate-pulse" />
                Pagamento em análise pelo Mercado Pago. Esta tela atualiza sozinha.
            </p>
        );
    }

    if (!PUBLIC_KEY_MERCADO_PAGO) {
        return (
            <p className="text-sm text-erro">
                O pagamento com cartão está indisponível agora. Cancele e faça o pedido com Pix ou pagando na entrega.
            </p>
        );
    }

    iniciarMercadoPago();

    return (
        <div className="flex flex-col gap-2">
            {atual?.status === "REJECTED" && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-erro">{motivoDaRecusa(atual.detalhe)}</p>
            )}
            {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-erro">{erro}</p>}
            <CardPayment
                // Nova instância a cada tentativa: o token do Brick é de uso único.
                key={atual?.id ?? "primeira"}
                locale="pt-BR"
                initialization={{ amount: pedido.total }}
                customization={{ paymentMethods: { minInstallments: 1, maxInstallments: 1 } }}
                onSubmit={async (dados) => {
                    setErro(null);

                    try {
                        onPago(
                            await pagarComCartao(pedido.id, pedido.token, {
                                token: dados.token,
                                bandeira: dados.payment_method_id,
                                email: dados.payer?.email,
                                documento: dados.payer?.identification
                                    ? {
                                          tipo: dados.payer.identification.type,
                                          numero: dados.payer.identification.number,
                                      }
                                    : undefined,
                            })
                        );
                    } catch (e) {
                        setErro(mensagemDeErro(e));
                    }
                }}
                onError={(e) => {
                    if (e.type === "critical") {
                        setErro("O formulário do cartão não carregou. Recarregue a página ou pague com Pix.");
                    }
                }}
            />
        </div>
    );
}
