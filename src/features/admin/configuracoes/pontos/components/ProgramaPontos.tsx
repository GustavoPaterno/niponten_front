"use client";

import { useEffect, useState } from "react";
import { CircularProgress, TextField } from "@mui/material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { formatCurrency, formatDate, parsePreco } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    buscarConfiguracaoPontos,
    salvarConfiguracaoPontos,
    simularCompra,
    type CenarioCompra,
    type ConfiguracaoPontos,
    type SimulacaoCompra,
} from "@/src/services/pontos";

// Mesmos limites do backend: taxa com até 6 dígitos e 4 casas; valores em reais com 2 casas.
const TAXA_VALIDA = /^\d{1,6}([.,]\d{1,4})?$/;
const REAIS_VALIDOS = /^\d{1,9}([.,]\d{1,2})?$/;
const DIAS_VALIDOS = /^\d{1,6}$/;
const SALDO_VALIDO = /^\d{1,9}$/;

interface Formulario {
    taxa: string;
    valor: string;
    dias: string;
}

function paraTexto(numero: number): string {
    return String(numero).replace(".", ",");
}

function paraFormulario(configuracao: ConfiguracaoPontos): Formulario {
    return {
        taxa: paraTexto(configuracao.earnRate),
        valor: paraTexto(configuracao.pointValue),
        dias: configuracao.expirationDays === null ? "" : String(configuracao.expirationDays),
    };
}

/** Configuração do programa e simulador, que compara a configuração salva com a digitada. */
export default function ProgramaPontos() {
    const toast = useToast();

    const [tentativa, setTentativa] = useState(0);
    const [erroCarga, setErroCarga] = useState<string | null>(null);
    const [salva, setSalva] = useState<ConfiguracaoPontos | null>(null);
    const [form, setForm] = useState<Formulario>({ taxa: "", valor: "", dias: "" });
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [compra, setCompra] = useState("100");
    const [saldo, setSaldo] = useState("100");
    const [simulando, setSimulando] = useState(false);
    // O resultado guarda para quais valores foi calculado: se algo mudar, ele deixa de aparecer.
    const [resultado, setResultado] = useState<{ chave: string; dados: SimulacaoCompra } | null>(null);

    useEffect(() => {
        let cancelado = false;

        buscarConfiguracaoPontos()
            .then((configuracao) => {
                if (!cancelado) {
                    setSalva(configuracao);
                    setForm(paraFormulario(configuracao));
                    setErroCarga(null);
                }
            })
            .catch((erro) => {
                if (!cancelado) {
                    setErroCarga(mensagemDeErro(erro));
                }
            });

        return () => {
            cancelado = true;
        };
    }, [tentativa]);

    const taxa = parsePreco(form.taxa.trim());
    const valor = parsePreco(form.valor.trim());
    const taxaInvalida = !TAXA_VALIDA.test(form.taxa.trim());
    const valorInvalido = !REAIS_VALIDOS.test(form.valor.trim()) || valor <= 0;
    const diasInvalidos =
        form.dias.trim() !== "" && (!DIAS_VALIDOS.test(form.dias.trim()) || Number(form.dias) <= 0);
    const formInvalido = taxaInvalida || valorInvalido || diasInvalidos;

    const compraInvalida = !REAIS_VALIDOS.test(compra.trim());
    const saldoInvalido = !SALDO_VALIDO.test(saldo.trim());
    const chaveSimulacao = `${form.taxa}|${form.valor}|${compra}|${saldo}`;
    const simulacao = resultado?.chave === chaveSimulacao ? resultado.dados : null;

    const alterar = (campo: keyof Formulario) => (evento: React.ChangeEvent<HTMLInputElement>) => {
        const texto = evento.target.value;

        setForm((atual) => ({ ...atual, [campo]: texto }));
    };

    const salvar = async () => {
        setTentouSalvar(true);

        if (formInvalido) {
            return;
        }

        setSalvando(true);

        try {
            const nova = await salvarConfiguracaoPontos({
                earnRate: taxa,
                pointValue: valor,
                expirationDays: form.dias.trim() === "" ? null : Number(form.dias),
            });

            setSalva(nova);
            setForm(paraFormulario(nova));
            setTentouSalvar(false);
            // "Hoje" mudou: a comparação anterior ficou velha.
            setResultado(null);
            toast.success("Configuração de pontos salva.");
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        } finally {
            setSalvando(false);
        }
    };

    const simular = async () => {
        if (taxaInvalida || valorInvalido) {
            setTentouSalvar(true);
            toast.error("Corrija a configuração antes de simular.");

            return;
        }

        if (!salva || compraInvalida || saldoInvalido) {
            return;
        }

        setSimulando(true);

        try {
            const dados = await simularCompra({
                compra: parsePreco(compra.trim()),
                saldo: Number(saldo.trim()),
                valorDoPontoAtual: salva.pointValue,
                proposta: { earnRate: taxa, pointValue: valor },
            });

            setResultado({ chave: chaveSimulacao, dados });
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        } finally {
            setSimulando(false);
        }
    };

    if (!salva) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-6 py-10 shadow-component">
                {erroCarga ? (
                    <>
                        <p role="alert" className="text-center text-sm text-erro">
                            {erroCarga}
                        </p>
                        <Button
                            text="Tentar novamente"
                            color={ButtonColor.Secondary}
                            onClick={() => {
                                setErroCarga(null);
                                setTentativa((t) => t + 1);
                            }}
                        />
                    </>
                ) : (
                    <CircularProgress aria-label="Carregando configuração" />
                )}
            </div>
        );
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <section className="rounded-xl bg-white p-4 text-tinta shadow-component sm:p-6">
                <h2 className="font-display text-lg font-bold">Configuração</h2>
                <p className="mt-1 text-sm text-tinta-suave">
                    Vale apenas para pedidos novos. Última alteração: {formatDate(salva.updatedAt)}.
                </p>

                {salva.earnRate === 0 && (
                    <p className="mt-3 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700">
                        O acúmulo de pontos está desligado: os pedidos novos não rendem pontos.
                    </p>
                )}

                <div className="mt-5 flex flex-col gap-5">
                    <TextField
                        label="Pontos ganhos por R$ 1 pago"
                        value={form.taxa}
                        onChange={alterar("taxa")}
                        required
                        fullWidth
                        error={tentouSalvar && taxaInvalida}
                        helperText={
                            tentouSalvar && taxaInvalida
                                ? "Informe um número igual ou maior que zero, com até 4 casas decimais."
                                : "Use 0 para desligar o acúmulo. A taxa de entrega não rende pontos."
                        }
                        slotProps={{ htmlInput: { inputMode: "decimal" } }}
                    />

                    <TextField
                        label="Valor de 1 ponto no resgate"
                        value={form.valor}
                        onChange={alterar("valor")}
                        required
                        fullWidth
                        error={tentouSalvar && valorInvalido}
                        helperText={
                            tentouSalvar && valorInvalido
                                ? "Informe um valor maior que zero, com até 2 casas decimais."
                                : "Desconto em reais que cada ponto dá."
                        }
                        slotProps={{
                            htmlInput: { inputMode: "decimal" },
                            input: {
                                startAdornment: <span className="mr-2 text-sm text-tinta-suave">R$</span>,
                            },
                        }}
                    />

                    <TextField
                        label="Validade dos pontos (dias)"
                        value={form.dias}
                        onChange={alterar("dias")}
                        fullWidth
                        error={tentouSalvar && diasInvalidos}
                        helperText={
                            tentouSalvar && diasInvalidos
                                ? "Informe um número inteiro de dias maior que zero, ou deixe vazio."
                                : "Deixe vazio para os pontos não vencerem."
                        }
                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                    />
                </div>

                <div className="mt-6 flex justify-end">
                    <Button
                        text={salvando ? "Salvando..." : "Salvar configuração"}
                        color={ButtonColor.Green}
                        onClick={salvando ? () => undefined : salvar}
                    />
                </div>
            </section>

            <section className="rounded-xl bg-white p-4 text-tinta shadow-component sm:p-6">
                <h2 className="font-display text-lg font-bold">Simulador</h2>
                <p className="mt-1 text-sm text-tinta-suave">
                    Veja quanto o cliente paga usando os pontos que já tem, hoje e com os valores digitados na
                    configuração. Nada é salvo.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:items-start">
                    <TextField
                        label="Valor da compra (sem entrega)"
                        value={compra}
                        onChange={(evento) => setCompra(evento.target.value)}
                        fullWidth
                        error={compraInvalida}
                        helperText={compraInvalida ? "Informe um valor com até 2 casas decimais." : undefined}
                        slotProps={{
                            htmlInput: { inputMode: "decimal" },
                            input: {
                                startAdornment: <span className="mr-2 text-sm text-tinta-suave">R$</span>,
                            },
                        }}
                    />

                    <TextField
                        label="Pontos aplicados"
                        value={saldo}
                        onChange={(evento) => setSaldo(evento.target.value)}
                        fullWidth
                        error={saldoInvalido}
                        helperText={saldoInvalido ? "Informe um número inteiro, 0 ou mais." : undefined}
                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                    />
                </div>

                <div className="mt-3 flex justify-end">
                    <Button
                        text={simulando ? "Simulando..." : "Simular"}
                        color={ButtonColor.Secondary}
                        onClick={simulando ? () => undefined : simular}
                    />
                </div>

                {simulacao && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-live="polite">
                        <Cenario
                            titulo="Hoje"
                            compra={parsePreco(compra.trim())}
                            saldo={Number(saldo.trim())}
                            cenario={simulacao.atual}
                        />
                        <Cenario
                            titulo="Com a proposta"
                            compra={parsePreco(compra.trim())}
                            saldo={Number(saldo.trim())}
                            cenario={simulacao.proposta}
                            destaque
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function pontosPorExtenso(quantidade: number): string {
    return `${quantidade.toLocaleString("pt-BR")} ${quantidade === 1 ? "ponto" : "pontos"}`;
}

interface CenarioProps {
    titulo: string;
    /** Valor da compra simulada, em reais. */
    compra: number;
    /** Pontos do cliente antes da compra. */
    saldo: number;
    cenario: CenarioCompra;
    destaque?: boolean;
}

function Cenario({ titulo, compra, saldo, cenario, destaque }: CenarioProps) {
    return (
        <div className={`rounded-xl bg-chapa p-4 ${destaque ? "ring-2 ring-marca" : "ring-1 ring-black/5"}`}>
            <p className="text-xs font-semibold text-tinta-suave">{titulo}</p>

            <p className="mt-2 text-xs text-tinta-suave">Total com desconto</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{formatCurrency(cenario.total)}</p>

            <dl className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3 text-sm tabular-nums">
                <div className="flex justify-between gap-3">
                    <dt className="text-tinta-suave">Valor da compra</dt>
                    <dd>{formatCurrency(compra)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt className="text-tinta-suave">Desconto ({pontosPorExtenso(cenario.pontosUsados)})</dt>
                    <dd className="shrink-0 font-semibold text-marca">− {formatCurrency(cenario.desconto)}</dd>
                </div>
            </dl>

            <p className="mt-3 text-xs text-tinta-suave">
                Sobram {pontosPorExtenso(saldo - cenario.pontosUsados)} do saldo. Esta compra rende{" "}
                {pontosPorExtenso(cenario.pontosGanhos)} para as próximas.
            </p>
        </div>
    );
}
