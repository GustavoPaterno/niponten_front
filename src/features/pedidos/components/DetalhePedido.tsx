"use client";

import { useEffect, useState } from "react";
import { CircularProgress, Drawer, TextField, useMediaQuery } from "@mui/material";
import { Close } from "@mui/icons-material";
import type { OrderResponse } from "@joao.sumi/nippon-ten";

import { useToast } from "@/src/components/feedback/ToastProvider";
import { formatCurrency } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    NOME_PAGAMENTO,
    NOME_STATUS,
    NOME_TIPO,
    avancarPedido,
    buscarPedido,
    cancelarPedido,
    marcarComoPago,
    minutosDesde,
    proximaEtapa,
    type StatusPedido,
} from "@/src/services/pedidos";

import { campoTexto } from "../estilosMui";
import { ICONE_TIPO, corDoTempo, formatarTempo } from "./CardPedido";

const COR_STATUS: Record<StatusPedido, string> = {
    PENDING: "bg-erro-fundo text-erro",
    IN_PREPARATION: "bg-amber-100 text-amber-800",
    READY: "bg-blue-100 text-blue-700",
    OUT_FOR_DELIVERY: "bg-violet-100 text-violet-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-black/10 text-tinta-suave",
};

export function SeloStatus({ status }: { status: StatusPedido }) {
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COR_STATUS[status]}`}>
            {NOME_STATUS[status]}
        </span>
    );
}

function hora(iso?: string): string {
    return iso
        ? new Date(iso).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "—";
}

interface DetalhePedidoProps {
    /** Pedido aberto; `null` fecha o painel. */
    id: number | null;
    onFechar: () => void;
    /** Avisa a tela de que algo mudou (status, pagamento), para recarregar a lista. */
    onAlterado?: () => void;
    /** No histórico só se consulta: sem botões de ação. */
    somenteLeitura?: boolean;
}

export default function DetalhePedido({ id, onFechar, onAlterado, somenteLeitura }: DetalhePedidoProps) {
    const celular = useMediaQuery("(max-width:639px)");

    return (
        <Drawer
            anchor="right"
            open={id !== null}
            onClose={onFechar}
            slotProps={{ paper: { sx: { width: celular ? "100%" : 460 } } }}
        >
            {id !== null && (
                // A key reinicia o estado ao trocar de pedido.
                <Conteudo
                    key={id}
                    id={id}
                    onFechar={onFechar}
                    onAlterado={onAlterado}
                    somenteLeitura={somenteLeitura}
                />
            )}
        </Drawer>
    );
}

function Conteudo({
    id,
    onFechar,
    onAlterado,
    somenteLeitura,
}: {
    id: number;
    onFechar: () => void;
    onAlterado?: () => void;
    somenteLeitura?: boolean;
}) {
    const toast = useToast();
    const [pedido, setPedido] = useState<OrderResponse | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [recarga, setRecarga] = useState(0);
    const [ocupado, setOcupado] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const [motivo, setMotivo] = useState("");
    // Momento em que o painel abriu: base do "há X min" (o painel é reaberto a cada pedido).
    const [abertoEm] = useState(() => Date.now());

    useEffect(() => {
        let cancelado = false;

        buscarPedido(id)
            .then((p) => !cancelado && setPedido(p))
            .catch((e) => !cancelado && setErro(mensagemDeErro(e)));

        return () => {
            cancelado = true;
        };
    }, [id, recarga]);

    const executar = async (acao: () => Promise<void>, sucesso: string) => {
        setOcupado(true);

        try {
            await acao();
            toast.success(sucesso);
            setCancelando(false);
            setRecarga((r) => r + 1);
            onAlterado?.();
        } catch (e) {
            toast.error(mensagemDeErro(e));
        } finally {
            setOcupado(false);
        }
    };

    const status = pedido?.status ?? "PENDING";
    const tipo = pedido?.fulfillmentType ?? "PICKUP";
    const proxima = pedido ? proximaEtapa(status, tipo) : null;
    const ativo = status !== "COMPLETED" && status !== "CANCELLED";
    const IconeTipo = ICONE_TIPO[tipo];
    const minutos = pedido?.createdAt ? minutosDesde(pedido.createdAt, abertoEm) : 0;

    return (
        <div className="flex h-full flex-col text-tinta">
            <header className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="font-display text-xl font-extrabold tabular-nums">
                        #{pedido?.code ?? "…"}
                    </h2>
                    {pedido && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-tinta-suave">
                            <SeloStatus status={status} />
                            <span>{hora(pedido.createdAt)}</span>
                            {ativo && (
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${corDoTempo(minutos)}`}>
                                    há {formatarTempo(minutos)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onFechar}
                    aria-label="Fechar"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-tinta-suave hover:bg-chapa"
                >
                    <Close fontSize="small" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
                {!pedido && !erro && (
                    <div className="flex justify-center py-16">
                        <CircularProgress size={28} sx={{ color: "var(--primary)" }} />
                    </div>
                )}

                {erro && <p className="py-10 text-center text-sm text-erro">{erro}</p>}

                {pedido && (
                    <div className="flex flex-col gap-6">
                        <Bloco titulo="Cliente">
                            <p className="font-medium">
                                {pedido.guestName || (pedido.clientId ? `Cliente #${pedido.clientId}` : "Cliente")}
                            </p>
                            {pedido.guestPhone && (
                                <a href={`tel:${pedido.guestPhone}`} className="text-sm text-marca">
                                    {pedido.guestPhone}
                                </a>
                            )}
                        </Bloco>

                        <Bloco titulo="Entrega">
                            <p className="flex items-center gap-1.5 font-medium">
                                <IconeTipo sx={{ fontSize: 20 }} />
                                {NOME_TIPO[tipo]}
                            </p>
                            {pedido.address && (
                                <p className="text-sm text-tinta-suave">
                                    {[pedido.address.streetAddress, pedido.address.number]
                                        .filter(Boolean)
                                        .join(", ")}
                                    {pedido.address.complement && `, ${pedido.address.complement}`}
                                    {pedido.address.cep && `, CEP ${pedido.address.cep}`}
                                </p>
                            )}
                        </Bloco>

                        <Bloco titulo="Itens">
                            <ul className="flex flex-col divide-y divide-black/5">
                                {(pedido.items ?? []).map((item, i) => (
                                    <li key={i} className="flex gap-3 py-2.5">
                                        <span className="w-7 shrink-0 font-bold text-marca">
                                            {item.quantity}x
                                        </span>
                                        <div className="min-w-0 flex-1 text-sm">
                                            <p className="font-medium text-tinta">
                                                {item.name}
                                                {item.sizeName && (
                                                    <span className="font-normal text-tinta-suave"> ({item.sizeName})</span>
                                                )}
                                            </p>
                                            {(item.comboComponents ?? []).map((c, j) => (
                                                <p key={j} className="text-tinta-suave">
                                                    {c.quantity}x {c.name}
                                                    {c.sizeName && ` (${c.sizeName})`}
                                                </p>
                                            ))}
                                            {(item.removedIngredients ?? []).length > 0 && (
                                                <p className="text-erro">
                                                    Sem{" "}
                                                    {(item.removedIngredients ?? [])
                                                        .map((r) => r.name?.toLowerCase())
                                                        .join(", ")}
                                                </p>
                                            )}
                                            {(item.additionals ?? []).length > 0 && (
                                                <p className="text-tinta-suave">
                                                    +{" "}
                                                    {(item.additionals ?? [])
                                                        .map((a) => `${a.name}${(a.quantity ?? 1) > 1 ? ` (${a.quantity}x)` : ""}`)
                                                        .join(", ")}
                                                </p>
                                            )}
                                            {item.notes && <p className="italic text-tinta-suave">“{item.notes}”</p>}
                                        </div>
                                        <span className="shrink-0 text-sm tabular-nums">
                                            {formatCurrency(item.total)}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {pedido.notes && (
                                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                    <strong>Observação:</strong> {pedido.notes}
                                </p>
                            )}
                        </Bloco>

                        <Bloco titulo="Pagamento">
                            <dl className="flex flex-col gap-1 text-sm">
                                <Linha rotulo="Subtotal" valor={formatCurrency(pedido.subtotal)} />
                                {(pedido.discount ?? 0) > 0 && (
                                    <Linha rotulo="Desconto" valor={`− ${formatCurrency(pedido.discount)}`} />
                                )}
                                {(pedido.deliveryFee ?? 0) > 0 && (
                                    <Linha rotulo="Taxa de entrega" valor={formatCurrency(pedido.deliveryFee)} />
                                )}
                                <div className="flex justify-between border-t border-black/10 pt-1.5 text-base font-bold">
                                    <dt>Total</dt>
                                    <dd className="tabular-nums">{formatCurrency(pedido.total)}</dd>
                                </div>
                            </dl>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-sm">
                                    {pedido.paymentMethod ? NOME_PAGAMENTO[pedido.paymentMethod] : "—"}
                                </span>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        pedido.paid ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-800"
                                    }`}
                                >
                                    {pedido.paid ? `Pago ${pedido.paidAt ? hora(pedido.paidAt) : ""}` : "A receber"}
                                </span>
                                {!somenteLeitura && !pedido.paid && status !== "CANCELLED" && (
                                    <button
                                        type="button"
                                        disabled={ocupado}
                                        onClick={() => executar(() => marcarComoPago(id), "Pagamento registrado.")}
                                        className="rounded-full px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-300 hover:bg-green-50 disabled:opacity-50"
                                    >
                                        Marcar como pago
                                    </button>
                                )}
                            </div>
                        </Bloco>

                        {pedido.cancelReason && (
                            <Bloco titulo="Motivo do cancelamento">
                                <p className="text-sm text-tinta">{pedido.cancelReason}</p>
                            </Bloco>
                        )}

                        {(pedido.statusHistory ?? []).length > 0 && (
                            <Bloco titulo="Andamento">
                                <ol className="relative flex flex-col gap-2 border-l-2 border-black/10 pl-4 text-sm">
                                    {(pedido.statusHistory ?? []).map((h, i) => (
                                        <li key={i} className="relative">
                                            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-marca" />
                                            <span className="font-medium">{h.status ? NOME_STATUS[h.status] : "—"}</span>
                                            <span className="text-tinta-suave"> às {hora(h.changedAt)}</span>
                                        </li>
                                    ))}
                                </ol>
                            </Bloco>
                        )}

                        {pedido.feedback && (
                            <Bloco titulo="Avaliação do cliente">
                                <p className="text-amber-500">
                                    {"★".repeat(pedido.feedback.rating ?? 0)}
                                    <span className="text-black/20">{"★".repeat(5 - (pedido.feedback.rating ?? 0))}</span>
                                </p>
                                {pedido.feedback.comment && (
                                    <p className="text-sm text-tinta-suave">“{pedido.feedback.comment}”</p>
                                )}
                            </Bloco>
                        )}
                    </div>
                )}
            </div>

            {pedido && !somenteLeitura && ativo && (
                <footer className="border-t border-black/10 px-5 py-4">
                    {cancelando ? (
                        <div className="flex flex-col gap-3">
                            <TextField
                                label="Motivo do cancelamento"
                                placeholder="Ex.: cliente desistiu, ingrediente acabou..."
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value.slice(0, 200))}
                                multiline
                                minRows={2}
                                fullWidth
                                autoFocus
                                helperText={`Opcional (${motivo.length}/200)`}
                                sx={campoTexto}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCancelando(false)}
                                    disabled={ocupado}
                                    className="h-10 flex-1 rounded-lg text-sm font-semibold ring-1 ring-black/15 hover:bg-chapa"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => executar(() => cancelarPedido(id, motivo), "Pedido cancelado.")}
                                    disabled={ocupado}
                                    className="h-10 flex-1 rounded-lg bg-tinta text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                                >
                                    Confirmar cancelamento
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCancelando(true)}
                                disabled={ocupado}
                                className="h-11 rounded-lg px-4 text-sm font-semibold text-erro ring-1 ring-erro/30 hover:bg-marca/10"
                            >
                                Cancelar pedido
                            </button>
                            {proxima && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        executar(
                                            () => avancarPedido(id, proxima.status),
                                            `Pedido #${pedido.code}: ${NOME_STATUS[proxima.status].toLowerCase()}.`
                                        )
                                    }
                                    disabled={ocupado}
                                    className="h-11 flex-1 rounded-lg bg-marca text-sm font-semibold text-white hover:bg-marca-escura disabled:opacity-60"
                                >
                                    {ocupado ? "Atualizando..." : proxima.acao}
                                </button>
                            )}
                        </div>
                    )}
                </footer>
            )}
        </div>
    );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-1.5">
            <h3 className="font-display text-xs font-bold text-tinta-suave/70">{titulo}</h3>
            {children}
        </section>
    );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
    return (
        <div className="flex justify-between text-tinta-suave">
            <dt>{rotulo}</dt>
            <dd className="tabular-nums">{valor}</dd>
        </div>
    );
}
