"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircularProgress, Collapse } from "@mui/material";
import {
    CancelOutlined,
    CheckCircle,
    DeliveryDiningOutlined,
    ExpandMore,
    HourglassTopOutlined,
    LocalFireDepartmentOutlined,
    PaymentsOutlined,
    ReceiptLongOutlined,
    TaskAltOutlined,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";
import type { OrderResponse, Status3 } from "@joao.sumi/nippon-ten";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { formatCurrency } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import { linkDeAcesso } from "@/src/lib/navegacao";
import {
    STATUS_ATIVOS,
    buscarMeuPedido,
    cancelarMeuPedido,
    listarMeusPedidos,
    type MeuPedido,
    type TipoEntregaCliente,
} from "@/src/services/checkout";

import { ICONE_TIPO, NOME_TIPO, data } from "./rotulos";

// Reserva: além dos eventos em tempo real, a lista se atualiza nesse intervalo.
const ATUALIZAR_MS = 20_000;

// Uma coluna no celular; a partir de md, grade que usa a largura toda.
// items-start: abrir os itens de um card não estica os vizinhos da mesma linha.
const GRADE = "grid grid-cols-1 items-start gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 2xl:grid-cols-4";

const NOME_METODO: Record<string, string> = { PIX: "Pix", CARD: "Cartão", CASH: "Dinheiro" };

/** Etapas mostradas ao cliente, conforme o tipo de entrega e o pagamento. */
function etapas(tipo: TipoEntregaCliente, online: boolean): { status: Status3; label: string }[] {
    const comuns = [
        // Pago online, o pedido só chega à cozinha depois da aprovação.
        ...(online ? [{ status: "AWAITING_PAYMENT" as Status3, label: "Pagamento" }] : []),
        { status: "PENDING" as Status3, label: "Recebido" },
        { status: "IN_PREPARATION" as Status3, label: "Em preparo" },
    ];

    if (tipo === "DELIVERY") {
        return [
            ...comuns,
            { status: "READY", label: "Pronto" },
            { status: "OUT_FOR_DELIVERY", label: "A caminho" },
            { status: "COMPLETED", label: "Entregue" },
        ];
    }

    return [
        ...comuns,
        { status: "READY", label: tipo === "PICKUP" ? "Pronto para retirar" : "Pronto" },
        { status: "COMPLETED", label: tipo === "PICKUP" ? "Retirado" : "Servido" },
    ];
}

/** Texto curto do momento atual, para o cliente. */
function frase(p: MeuPedido): string {
    switch (p.status) {
        case "AWAITING_PAYMENT":
            return "Aguardando o pagamento. O pedido vai para a cozinha assim que ele for aprovado.";
        case "PENDING":
            return "Recebemos seu pedido e já vamos começar.";
        case "IN_PREPARATION":
            return "Seu pedido está sendo preparado.";
        case "READY":
            return p.tipo === "DELIVERY"
                ? "Pronto! Logo sai para entrega."
                : p.tipo === "PICKUP"
                  ? "Pronto! Pode retirar no balcão."
                  : "Pronto! Já vamos servir.";
        case "OUT_FOR_DELIVERY":
            return "Saiu para entrega. Está a caminho!";
        case "COMPLETED":
            return "Pedido concluído.";
        case "CANCELLED":
            return "Pedido cancelado.";
    }
}

/**
 * Selo do status no topo do card: cor e ícone próprios, para o cliente achar o pedido pelo estado
 * sem ler a frase. "Pronto" é o único cheio: é quando o cliente precisa agir (retirar ou receber).
 */
function selo(p: MeuPedido): { label: string; classe: string; Icone: SvgIconComponent } {
    const rotuloDaEtapa = etapas(p.tipo, false).find((e) => e.status === p.status)?.label ?? "";

    switch (p.status) {
        case "AWAITING_PAYMENT":
            return { label: "Aguardando pagamento", classe: "bg-amber-100 text-amber-900", Icone: HourglassTopOutlined };
        case "PENDING":
            return { label: "Recebido", classe: "bg-sky-100 text-sky-900", Icone: ReceiptLongOutlined };
        case "IN_PREPARATION":
            return { label: "Em preparo", classe: "bg-orange-100 text-orange-900", Icone: LocalFireDepartmentOutlined };
        case "READY":
            return { label: rotuloDaEtapa, classe: "bg-green-700 text-white", Icone: TaskAltOutlined };
        case "OUT_FOR_DELIVERY":
            return { label: "A caminho", classe: "bg-indigo-100 text-indigo-900", Icone: DeliveryDiningOutlined };
        case "COMPLETED":
            return { label: rotuloDaEtapa, classe: "bg-green-100 text-green-800", Icone: CheckCircle };
        case "CANCELLED":
            return { label: "Cancelado", classe: "bg-erro-fundo text-erro", Icone: CancelOutlined };
    }
}

/** Situação do pagamento, numa linha. */
function resumoPagamento(p: MeuPedido): string | null {
    if (!p.metodo) {
        return null;
    }

    const metodo = NOME_METODO[p.metodo] ?? p.metodo;

    if (p.status === "CANCELLED") {
        // Pago online e cancelado: o backend estorna sozinho.
        return p.pago && p.canal === "ONLINE" ? `${metodo} online, estorno solicitado` : `${metodo}, não cobrado`;
    }

    if (p.canal === "ONLINE") {
        return p.pago ? `Pagamento aprovado (${metodo})` : `${metodo} online, aguardando pagamento`;
    }

    return p.pago ? `${metodo}, pago` : `${metodo}, pagar na ${p.tipo === "DELIVERY" ? "entrega" : "retirada"}`;
}

export default function MeusPedidos() {
    const { me, carregando } = useSessao();
    const router = useRouter();
    const busca = useSearchParams();
    // Vindo da tela de pagamento: destaca o pedido que acabou de ser pago.
    const destaque = Number(busca.get("destaque")) || null;
    // Link antigo (/pedidos?pagar=id): o pagamento agora tem tela própria.
    const pagar = Number(busca.get("pagar")) || null;
    const [pedidos, setPedidos] = useState<MeuPedido[] | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = useCallback(() => {
        listarMeusPedidos(me)
            .then((lista) => {
                setPedidos(lista);
                setErro(null);
            })
            .catch((e) => setErro(mensagemDeErro(e)));
    }, [me]);

    // Agrupa vários eventos seguidos (ex.: status e pagamento) numa recarga só.
    const timerRecarga = useRef<ReturnType<typeof setTimeout> | null>(null);
    const carregarEmBreve = useCallback(() => {
        if (timerRecarga.current) {
            clearTimeout(timerRecarga.current);
        }

        timerRecarga.current = setTimeout(carregar, 300);
    }, [carregar]);

    // Carga inicial + reserva periódica + recarga ao voltar para a aba.
    useEffect(() => {
        if (carregando) {
            return;
        }

        const inicial = setTimeout(carregar, 0);
        const intervalo = setInterval(carregar, ATUALIZAR_MS);
        const aoVoltar = () => {
            if (document.visibilityState === "visible") {
                carregar();
            }
        };
        document.addEventListener("visibilitychange", aoVoltar);

        return () => {
            clearTimeout(inicial);
            clearInterval(intervalo);
            document.removeEventListener("visibilitychange", aoVoltar);
            if (timerRecarga.current) {
                clearTimeout(timerRecarga.current);
            }
        };
    }, [carregando, carregar]);

    useEffect(() => {
        if (pagar) {
            router.replace(`/pedidos/${pagar}/pagamento`);
        }
    }, [pagar, router]);

    const ativos = (pedidos ?? []).filter((p) => STATUS_ATIVOS.includes(p.status));

    // Chave estável dos pedidos em andamento: só reabre os streams quando a lista muda.
    const chaveAtivos = JSON.stringify(ativos.map((p) => [p.id, p.token]));

    // Tempo real: um stream por pedido em andamento (GET /orders/{id}/events). Visitante manda o
    // código de acompanhamento em ?token= (o proxy o repassa como cabeçalho); logado usa o login.
    useEffect(() => {
        const lista = JSON.parse(chaveAtivos) as [number, string | null][];

        const fontes = lista.map(([id, token]) => {
            const busca = token ? `?token=${encodeURIComponent(token)}` : "";
            const fonte = new EventSource(`/backend/orders/${id}/events${busca}`);

            // Qualquer evento do pedido (status, pagamento, cancelamento, itens) recarrega a lista.
            fonte.onmessage = carregarEmBreve;

            return fonte;
        });

        return () => fontes.forEach((fonte) => fonte.close());
    }, [chaveAtivos, carregarEmBreve]);

    const finalizados = (pedidos ?? []).filter((p) => !STATUS_ATIVOS.includes(p.status));

    return (
        <div className="-mx-2 -mb-2 -mt-2 min-h-[calc(100dvh-4rem)] bg-chapa pb-12 text-tinta sm:-mx-4 sm:-mb-4 sm:-mt-4">
            <div className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-6 md:pt-8">
                <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Meus pedidos</h1>
                {!me && !carregando && (
                    <p className="mt-1 text-sm text-tinta-suave">
                        Pedidos feitos neste aparelho.{" "}
                        <Link href={linkDeAcesso("/login", "/pedidos")} className="font-medium text-marca">
                            Entre
                        </Link>{" "}
                        para ver os da sua conta.
                    </p>
                )}

                {erro && !pedidos && (
                    <div className="mt-6 rounded-2xl bg-white px-6 py-10 text-center ring-1 ring-black/5">
                        <p className="font-semibold">Não foi possível carregar seus pedidos</p>
                        <p className="mt-1 text-sm text-tinta-suave">{erro}</p>
                        <button
                            type="button"
                            onClick={carregar}
                            className="mt-4 rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white"
                        >
                            Tentar de novo
                        </button>
                    </div>
                )}

                {!pedidos && !erro && (
                    <div className={`mt-6 ${GRADE}`} aria-busy="true">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/10" />
                        ))}
                    </div>
                )}

                {pedidos && pedidos.length === 0 && (
                    <div className="mt-10 flex flex-col items-center gap-3 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-marca/10 text-marca">
                            <ReceiptLongOutlined fontSize="large" />
                        </div>
                        <h2 className="font-display text-lg font-bold">Nenhum pedido por aqui</h2>
                        <p className="text-sm text-tinta-suave">Quando você fizer um pedido, ele aparece aqui.</p>
                        <Link
                            href="/"
                            className="mt-2 rounded-full bg-marca px-6 py-2.5 text-sm font-display font-bold text-white"
                        >
                            Ver cardápio
                        </Link>
                    </div>
                )}

                {ativos.length > 0 && (
                    <section className="mt-6 flex flex-col gap-3">
                        <h2 className="font-display text-lg font-bold">
                            Em andamento <span className="font-normal text-tinta-suave">({ativos.length})</span>
                        </h2>
                        <div className={GRADE}>
                            {ativos.map((p) => (
                                <CartaoPedido
                                    key={p.id}
                                    pedido={p}
                                    ativo
                                    destacado={p.id === destaque}
                                    onMudou={carregarEmBreve}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {finalizados.length > 0 && (
                    <section className="mt-8 flex flex-col gap-3">
                        <h2 className="font-display text-lg font-bold">
                            Finalizados <span className="font-normal text-tinta-suave">({finalizados.length})</span>
                        </h2>
                        <div className={GRADE}>
                            {finalizados.map((p) => (
                                <CartaoPedido key={p.id} pedido={p} ativo={false} destacado={false} onMudou={carregarEmBreve} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

function CartaoPedido({
    pedido,
    ativo,
    destacado,
    onMudou,
}: {
    pedido: MeuPedido;
    ativo: boolean;
    /** Acabou de ser pago na tela de pagamento: rola até ele. */
    destacado: boolean;
    onMudou: () => void;
}) {
    const toast = useToast();
    const [aberto, setAberto] = useState(false);
    const [detalhe, setDetalhe] = useState<OrderResponse | null>(null);
    const [erroDetalhe, setErroDetalhe] = useState<string | null>(null);
    const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const artigo = useRef<HTMLElement>(null);

    const IconeTipo = ICONE_TIPO[pedido.tipo];
    const lista = etapas(pedido.tipo, pedido.canal === "ONLINE");
    const atual = lista.findIndex((e) => e.status === pedido.status);
    const cancelado = pedido.status === "CANCELLED";
    const aguardandoPagamento = pedido.status === "AWAITING_PAYMENT" && pedido.canal === "ONLINE";
    // O cliente cancela até o pedido começar a ser preparado.
    const podeCancelar = pedido.status === "AWAITING_PAYMENT" || pedido.status === "PENDING";
    const pagamento = resumoPagamento(pedido);
    const status = selo(pedido);

    useEffect(() => {
        if (destacado) {
            artigo.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [destacado]);

    const cancelar = async () => {
        setCancelando(true);

        try {
            await cancelarMeuPedido(pedido.id, pedido.token);
            toast.success(
                pedido.canal === "ONLINE" && pedido.pago
                    ? `Pedido #${pedido.codigo} cancelado. O estorno do pagamento foi pedido.`
                    : `Pedido #${pedido.codigo} cancelado.`
            );
            setConfirmarCancelamento(false);
            onMudou();
        } catch (e) {
            toast.error(mensagemDeErro(e));
        } finally {
            setCancelando(false);
        }
    };

    const alternar = () => {
        const abrir = !aberto;
        setAberto(abrir);

        if (abrir && !detalhe) {
            buscarMeuPedido(pedido.id, pedido.token)
                .then(setDetalhe)
                .catch((e) => setErroDetalhe(mensagemDeErro(e)));
        }
    };

    return (
        <article
            ref={artigo}
            className={`overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ${destacado ? "ring-2 ring-marca" : "ring-black/5"}`}
        >
            <button type="button" onClick={alternar} aria-expanded={aberto} className="flex w-full flex-col gap-2.5 p-3.5 text-left">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="font-display text-base font-extrabold tabular-nums">#{pedido.codigo}</p>
                        <p className="flex items-center gap-1.5 text-sm text-tinta-suave">
                            <IconeTipo sx={{ fontSize: 18 }} />
                            {NOME_TIPO[pedido.tipo]}, {data(pedido.criadoEm)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-display text-lg font-extrabold tabular-nums">{formatCurrency(pedido.total)}</p>
                        <p className="text-xs text-tinta-suave">
                            {pedido.quantidadeItens} {pedido.quantidadeItens === 1 ? "item" : "itens"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span
                        className={`flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${status.classe}`}
                    >
                        <status.Icone sx={{ fontSize: 18 }} />
                        {status.label}
                    </span>
                    {/* Finalizado: o selo já diz tudo. */}
                    {ativo && <p className="text-sm text-tinta">{frase(pedido)}</p>}
                </div>
                {/* Pagamento em texto, não pílula: o único destaque do card é o selo do status. */}
                {pagamento &&
                    (pedido.pago && !cancelado ? (
                        <p className="-mt-1 flex items-center gap-1 text-xs font-semibold text-green-800">
                            <CheckCircle sx={{ fontSize: 14 }} />
                            {pagamento}
                        </p>
                    ) : (
                        <p className="-mt-1 text-xs text-tinta-suave">{pagamento}</p>
                    ))}

                {/* Barra de etapas: só nos pedidos em andamento. */}
                {ativo && (
                    <ol className="flex items-start gap-1" aria-label="Andamento do pedido">
                        {lista.map((etapa, i) => {
                            const feita = i <= atual;

                            return (
                                <li key={etapa.status} className="flex min-w-0 flex-1 flex-col gap-1.5">
                                    <span
                                        className={`h-1.5 rounded-full ${
                                            i < atual ? "bg-marca" : i === atual ? "animate-pulse bg-marca" : "bg-black/10"
                                        }`}
                                    />
                                    <span
                                        className={`truncate text-[11px] leading-tight sm:text-xs ${
                                            i === atual
                                                ? "font-bold text-marca-escura"
                                                : feita
                                                  ? "font-semibold text-tinta"
                                                  : "text-tinta-suave"
                                        }`}
                                        title={etapa.label}
                                    >
                                        {etapa.label}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                )}

                <span className="flex items-center justify-center gap-1 text-xs font-medium text-tinta-suave">
                    {aberto ? "Ocultar itens" : "Ver itens"}
                    <ExpandMore sx={{ fontSize: 18 }} className={`transition-transform ${aberto ? "rotate-180" : ""}`} />
                </span>
            </button>

            {(aguardandoPagamento || (ativo && podeCancelar)) && (
                <div className="flex flex-col gap-2 px-3.5 pb-3.5">
                    {aguardandoPagamento && (
                        <Link
                            href={`/pedidos/${pedido.id}/pagamento`}
                            className="flex items-center justify-center gap-2 rounded-full bg-marca px-5 py-2.5 font-display text-sm font-bold text-white"
                        >
                            <PaymentsOutlined sx={{ fontSize: 18 }} />
                            Pagar agora
                        </Link>
                    )}
                    {ativo && podeCancelar && (
                        <button
                            type="button"
                            onClick={() => setConfirmarCancelamento(true)}
                            className="self-start text-xs font-semibold text-tinta-suave underline-offset-2 hover:underline"
                        >
                            Cancelar pedido
                        </button>
                    )}
                </div>
            )}

            <ConfirmDialog
                open={confirmarCancelamento}
                title={`Cancelar o pedido #${pedido.codigo}?`}
                confirmText="Cancelar pedido"
                cancelText="Voltar"
                danger
                loading={cancelando}
                onConfirm={cancelar}
                onCancel={() => setConfirmarCancelamento(false)}
            >
                {pedido.canal === "ONLINE" && pedido.pago
                    ? "O valor pago volta pelo mesmo meio de pagamento."
                    : "O pedido não será preparado."}
            </ConfirmDialog>

            <Collapse in={aberto} unmountOnExit>
                <div className="border-t border-black/5 px-3.5 py-3">
                    {!detalhe && !erroDetalhe && (
                        <div className="flex justify-center py-3">
                            <CircularProgress size={22} sx={{ color: "var(--primary)" }} />
                        </div>
                    )}
                    {erroDetalhe && <p className="py-2 text-sm text-erro">{erroDetalhe}</p>}
                    {detalhe && (
                        <ul className="flex flex-col gap-2 text-sm">
                            {(detalhe.items ?? []).map((item, i) => (
                                <li key={i} className="flex justify-between gap-3">
                                    <span className="min-w-0">
                                        <span className="font-semibold text-marca">{item.quantity}x</span>{" "}
                                        {item.name}
                                        {item.sizeName && <span className="text-tinta-suave"> ({item.sizeName})</span>}
                                        {(item.additionals ?? []).length > 0 && (
                                            <span className="block text-xs text-tinta-suave">
                                                + {(item.additionals ?? []).map((a) => a.name).join(", ")}
                                            </span>
                                        )}
                                    </span>
                                    <span className="shrink-0 tabular-nums">{formatCurrency(item.total)}</span>
                                </li>
                            ))}
                            {detalhe.cancelReason && (
                                <li className="rounded-lg bg-chapa px-3 py-2 text-tinta-suave">
                                    Motivo do cancelamento: {detalhe.cancelReason}
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            </Collapse>
        </article>
    );
}
