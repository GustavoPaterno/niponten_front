"use client";

import { useEffect, useState } from "react";
import { Close, ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    useMediaQuery,
} from "@mui/material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import LimitedTextField from "@/src/components/input/LimitedTextField";
import StatusChip from "@/src/components/status/StatusChip";
import { formatDate } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    MAXIMO_MOTIVO,
    ajustarPontos,
    buscarExtrato,
    buscarNomeDoCliente,
    buscarSaldo,
    type ClientePontos,
    type MovimentoPontos,
    type PaginaExtrato,
    type SaldoPontos,
    type TipoMovimento,
} from "@/src/services/pontos";

const TIPOS: Record<TipoMovimento, string> = {
    EARN: "Compra",
    REDEEM: "Resgate",
    REFUND: "Estorno",
    EXPIRE: "Expiração",
    ADJUST: "Ajuste manual",
};

type Operacao = "creditar" | "debitar";

function formatarDataHora(valor: string | null): string {
    if (!valor) {
        return "—";
    }

    return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function pontosPorExtenso(quantidade: number): string {
    return `${quantidade.toLocaleString("pt-BR")} ${quantidade === 1 ? "ponto" : "pontos"}`;
}

interface PontosClienteDialogProps {
    /** `null` = fechado. */
    cliente: ClientePontos | null;
    onClose: () => void;
}

export default function PontosClienteDialog({ cliente, onClose }: PontosClienteDialogProps) {
    const fullScreen = useMediaQuery("(max-width:639px)");

    return (
        <Dialog
            open={cliente !== null}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : "12px" } } }}
        >
            {/* O conteúdo só existe com o dialog aberto: o estado reinicia a cada cliente. */}
            {cliente && <Conteudo key={cliente.userId} cliente={cliente} onClose={onClose} />}
        </Dialog>
    );
}

interface Resumo {
    /** `null` = conta sem cadastro de cliente. */
    nome: string | null;
    saldo: SaldoPontos;
}

function Conteudo({ cliente, onClose }: { cliente: ClientePontos; onClose: () => void }) {
    const toast = useToast();
    const { userId } = cliente;

    // Muda para buscar tudo de novo (depois de um ajuste ou de "tentar novamente").
    const [versao, setVersao] = useState(0);
    const [pagina, setPagina] = useState(0);

    const [resumo, setResumo] = useState<Resumo | null>(null);
    const [erroResumo, setErroResumo] = useState<string | null>(null);

    const chaveExtrato = `${pagina}:${versao}`;
    const [extrato, setExtrato] = useState<{
        chave: string;
        dados: PaginaExtrato | null;
        erro: string | null;
    } | null>(null);

    const [operacao, setOperacao] = useState<Operacao>("creditar");
    const [quantidade, setQuantidade] = useState("");
    const [motivo, setMotivo] = useState("");
    const [tentouAjustar, setTentouAjustar] = useState(false);
    const [confirmando, setConfirmando] = useState(false);
    const [ajustando, setAjustando] = useState(false);

    useEffect(() => {
        let cancelado = false;

        Promise.all([buscarNomeDoCliente(userId), buscarSaldo(userId)])
            .then(([nome, saldo]) => {
                if (!cancelado) {
                    setResumo({ nome, saldo });
                    setErroResumo(null);
                }
            })
            .catch((erro) => {
                if (!cancelado) {
                    setErroResumo(mensagemDeErro(erro));
                }
            });

        return () => {
            cancelado = true;
        };
    }, [userId, versao]);

    useEffect(() => {
        let cancelado = false;
        const chave = `${pagina}:${versao}`;

        buscarExtrato(userId, pagina)
            .then((dados) => {
                if (!cancelado) {
                    setExtrato({ chave, dados, erro: null });
                }
            })
            .catch((erro) => {
                if (!cancelado) {
                    setExtrato({ chave, dados: null, erro: mensagemDeErro(erro) });
                }
            });

        return () => {
            cancelado = true;
        };
    }, [userId, pagina, versao]);

    // Enquanto a próxima página carrega, a anterior continua na tela (evita o dialog pular).
    const carregandoExtrato = extrato?.chave !== chaveExtrato;

    const numero = Number(quantidade);
    const quantidadeInvalida = !/^\d{1,9}$/.test(quantidade) || numero <= 0;
    const saldoInsuficiente =
        operacao === "debitar" && resumo !== null && !quantidadeInvalida && numero > resumo.saldo.saldo;
    const motivoInvalido = motivo.trim() === "";

    const pedirAjuste = () => {
        setTentouAjustar(true);

        if (!quantidadeInvalida && !saldoInsuficiente && !motivoInvalido) {
            setConfirmando(true);
        }
    };

    const confirmarAjuste = async () => {
        setAjustando(true);

        try {
            await ajustarPontos(userId, operacao === "creditar" ? numero : -numero, motivo);

            toast.success(operacao === "creditar" ? "Pontos creditados." : "Pontos debitados.");
            setQuantidade("");
            setMotivo("");
            setTentouAjustar(false);
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        } finally {
            setAjustando(false);
            setConfirmando(false);
            // Mesmo com erro o saldo pode ter mudado (ex.: pontos que venceram agora).
            setPagina(0);
            setVersao((v) => v + 1);
        }
    };

    return (
        <>
            <DialogTitle sx={{ px: { xs: 2, sm: 4 }, pt: 3, pb: 2, borderBottom: "1px solid #eeeeee" }}>
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="font-display text-xl font-bold text-tinta sm:text-2xl">
                            {resumo?.nome || "Pontos do cliente"}
                        </h2>
                        <p className="mt-1 break-all text-sm text-tinta-suave">{cliente.email}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-tinta-suave transition hover:bg-chapa hover:text-tinta"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
                {erroResumo ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <p role="alert" className="text-center text-sm text-erro">
                            {erroResumo}
                        </p>
                        <Button
                            text="Tentar novamente"
                            color={ButtonColor.Secondary}
                            onClick={() => {
                                setErroResumo(null);
                                setVersao((v) => v + 1);
                            }}
                        />
                    </div>
                ) : !resumo ? (
                    <div className="flex justify-center py-8">
                        <CircularProgress aria-label="Carregando saldo" />
                    </div>
                ) : resumo.nome === null ? (
                    <p className="py-8 text-center text-sm text-tinta-suave">
                        Esta conta não tem cadastro de cliente, por isso não acumula pontos.
                    </p>
                ) : (
                    <div className="flex flex-col gap-6 pt-3">
                        <div className="rounded-xl bg-chapa p-4">
                            <p className="text-xs font-semibold text-tinta-suave">Saldo disponível</p>
                            <p className="font-display text-3xl font-extrabold tabular-nums text-tinta">
                                {pontosPorExtenso(resumo.saldo.saldo)}
                            </p>
                            <p className="text-sm text-tinta-suave">
                                {resumo.saldo.proximoVencimento
                                    ? `${pontosPorExtenso(resumo.saldo.proximoVencimento.pontos)} com vencimento em ${formatDate(resumo.saldo.proximoVencimento.data)}.`
                                    : "Nenhum ponto com vencimento."}
                            </p>
                        </div>

                        <section>
                            <h3 className="font-display text-base font-bold text-tinta">Ajuste manual</h3>

                            <div className="mt-3 flex flex-col gap-4">
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <TextField
                                        select
                                        label="Operação"
                                        value={operacao}
                                        onChange={(e) => setOperacao(e.target.value as Operacao)}
                                        className="sm:w-48"
                                    >
                                        <MenuItem value="creditar">Creditar</MenuItem>
                                        <MenuItem value="debitar">Debitar</MenuItem>
                                    </TextField>

                                    <TextField
                                        label="Quantidade de pontos"
                                        value={quantidade}
                                        onChange={(e) => setQuantidade(e.target.value.trim())}
                                        required
                                        className="flex-1"
                                        error={tentouAjustar && (quantidadeInvalida || saldoInsuficiente)}
                                        helperText={
                                            tentouAjustar && quantidadeInvalida
                                                ? "Informe um número inteiro maior que zero."
                                                : tentouAjustar && saldoInsuficiente
                                                  ? "O débito não pode ser maior que o saldo."
                                                  : undefined
                                        }
                                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                                    />
                                </div>

                                <LimitedTextField
                                    label="Motivo"
                                    placeholder="Ex: compensação por atraso no pedido"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    maxChars={MAXIMO_MOTIVO}
                                    required
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    error={tentouAjustar && motivoInvalido}
                                    helperText={
                                        tentouAjustar && motivoInvalido ? "Informe o motivo do ajuste." : undefined
                                    }
                                />

                                <div className="flex justify-end">
                                    <Button
                                        text="Ajustar saldo"
                                        color={ButtonColor.Green}
                                        onClick={pedirAjuste}
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="font-display text-base font-bold text-tinta">Extrato</h3>

                            {!extrato ? (
                                <div className="flex justify-center py-6">
                                    <CircularProgress aria-label="Carregando extrato" />
                                </div>
                            ) : extrato.erro || !extrato.dados ? (
                                <p role="alert" className="py-4 text-sm text-erro">
                                    {extrato.erro}
                                </p>
                            ) : extrato.dados.movimentos.length === 0 ? (
                                <p className="py-4 text-sm text-tinta-suave">Nenhuma movimentação até agora.</p>
                            ) : (
                                <>
                                    <ul
                                        aria-busy={carregandoExtrato}
                                        className={`mt-2 divide-y divide-black/5 transition-opacity ${carregandoExtrato ? "opacity-50" : ""}`}
                                    >
                                        {extrato.dados.movimentos.map((movimento) => (
                                            <Movimento key={movimento.id} movimento={movimento} />
                                        ))}
                                    </ul>

                                    {extrato.dados.totalPaginas > 1 && (
                                        <div className="flex items-center justify-end gap-1">
                                            <IconButton
                                                size="small"
                                                aria-label="Página anterior"
                                                disabled={carregandoExtrato || pagina === 0}
                                                onClick={() => setPagina((p) => p - 1)}
                                            >
                                                <ChevronLeft fontSize="small" />
                                            </IconButton>
                                            <span className="px-2 text-sm text-tinta-suave">
                                                {pagina + 1} / {extrato.dados.totalPaginas}
                                            </span>
                                            <IconButton
                                                size="small"
                                                aria-label="Próxima página"
                                                disabled={carregandoExtrato || pagina + 1 >= extrato.dados.totalPaginas}
                                                onClick={() => setPagina((p) => p + 1)}
                                            >
                                                <ChevronRight fontSize="small" />
                                            </IconButton>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                )}
            </DialogContent>

            <ConfirmDialog
                open={confirmando}
                title={operacao === "creditar" ? "Creditar pontos" : "Debitar pontos"}
                danger={operacao === "debitar"}
                loading={ajustando}
                onConfirm={confirmarAjuste}
                onCancel={() => setConfirmando(false)}
            >
                <p>
                    {operacao === "creditar" ? "Creditar" : "Debitar"}{" "}
                    <strong>{quantidadeInvalida ? "" : pontosPorExtenso(numero)}</strong> de{" "}
                    <strong>{resumo?.nome || cliente.email}</strong>? O ajuste fica registrado no extrato.
                </p>
            </ConfirmDialog>
        </>
    );
}

function Movimento({ movimento }: { movimento: MovimentoPontos }) {
    const entrada = movimento.pontos > 0;
    const detalhe =
        movimento.motivo ?? (movimento.pedidoId !== null ? `Pedido #${movimento.pedidoId}` : null);

    return (
        <li className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={TIPOS[movimento.tipo] ?? movimento.tipo} tone="neutral" />
                    <span className="text-xs text-tinta-suave">{formatarDataHora(movimento.criadoEm)}</span>
                </div>

                {detalhe && <p className="mt-1 break-words text-sm text-tinta">{detalhe}</p>}

                {movimento.venceEm && (
                    <p className="text-xs text-tinta-suave">Vencimento: {formatDate(movimento.venceEm)}</p>
                )}
            </div>

            <span
                className={`shrink-0 font-display font-bold tabular-nums ${entrada ? "text-green-700" : "text-erro"}`}
            >
                {entrada ? "+" : ""}
                {movimento.pontos.toLocaleString("pt-BR")}
            </span>
        </li>
    );
}
