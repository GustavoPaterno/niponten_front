"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { ArrowBack, CheckCircle, ErrorOutlined } from "@mui/icons-material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { formatCurrency } from "@/src/lib/format";
import { ApiError, mensagemDeErro } from "@/src/lib/http";
import { linkDeAcesso } from "@/src/lib/navegacao";
import { cancelarMeuPedido, carregarMeuPedido, type PedidoComDetalhe } from "@/src/services/checkout";

import PagamentoOnline from "./PagamentoOnline";
import { ICONE_TIPO, NOME_TIPO, data } from "./rotulos";

// Depois de aprovado, o cliente vê a confirmação por um instante antes de ir acompanhar o pedido.
const IR_PARA_PEDIDOS_MS = 1_800;

/**
 * Tela de pagamento de um pedido online (/pedidos/[id]/pagamento). O checkout cria o pedido e
 * manda o cliente para cá; o card de "Meus pedidos" também traz de volta, com "Pagar agora".
 * Aprovado o pagamento, o cliente segue para "Meus pedidos", onde acompanha o preparo.
 */
export default function PagamentoPedido({ id }: { id: number }) {
    const { me, carregando } = useSessao();
    const router = useRouter();
    const toast = useToast();
    const [dados, setDados] = useState<PedidoComDetalhe | null>(null);
    const [erro, setErro] = useState<unknown>(null);
    const [aprovado, setAprovado] = useState(false);
    const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
    const [cancelando, setCancelando] = useState(false);
    const avisou = useRef(false);
    const estavaAguardando = useRef(false);

    const carregar = useCallback(() => {
        carregarMeuPedido(id)
            .then((d) => {
                setDados(d);
                setErro(null);
            })
            .catch(setErro);
    }, [id]);

    useEffect(() => {
        if (carregando) {
            return;
        }

        const inicial = setTimeout(carregar, 0);
        const aoVoltar = () => {
            if (document.visibilityState === "visible") {
                carregar();
            }
        };
        document.addEventListener("visibilitychange", aoVoltar);

        return () => {
            clearTimeout(inicial);
            document.removeEventListener("visibilitychange", aoVoltar);
        };
    }, [carregando, carregar]);

    const pedido = dados?.pedido ?? null;
    const aguardando = pedido?.status === "AWAITING_PAYMENT" && pedido.canal === "ONLINE";
    const codigo = pedido?.codigo;
    const token = pedido?.token ?? null;

    const aprovar = useCallback(() => {
        if (avisou.current) {
            return;
        }

        avisou.current = true;
        setAprovado(true);
        toast.success(`Pagamento do pedido #${codigo ?? id} aprovado!`);
        setTimeout(() => router.replace(`/pedidos?destaque=${id}`), IR_PARA_PEDIDOS_MS);
    }, [codigo, id, router, toast]);

    // Tempo real: cancelamento pela equipe, expiração ou aprovação recarregam o pedido.
    useEffect(() => {
        if (!aguardando) {
            return;
        }

        const fonte = new EventSource(`/backend/orders/${id}/events${token ? `?token=${encodeURIComponent(token)}` : ""}`);
        fonte.onmessage = carregar;

        return () => fonte.close();
    }, [aguardando, carregar, id, token]);

    // O pedido saiu de "aguardando pagamento" enquanto a tela estava aberta, já pago: aprovou.
    useEffect(() => {
        if (!pedido) {
            return;
        }

        if (aguardando) {
            estavaAguardando.current = true;
        } else if (estavaAguardando.current && pedido.pago && pedido.status !== "CANCELLED") {
            const t = setTimeout(aprovar, 0);

            return () => clearTimeout(t);
        }
    }, [aguardando, aprovar, pedido]);

    const cancelar = async () => {
        if (!pedido) {
            return;
        }

        setCancelando(true);

        try {
            await cancelarMeuPedido(pedido.id, pedido.token);
            toast.success(`Pedido #${pedido.codigo} cancelado.`);
            router.replace("/pedidos");
        } catch (e) {
            toast.error(mensagemDeErro(e));
            setCancelando(false);
            setConfirmarCancelamento(false);
            carregar();
        }
    };

    return (
        <div className="-mx-2 -mb-2 -mt-2 min-h-[calc(100dvh-4rem)] bg-chapa pb-12 text-tinta sm:-mx-4 sm:-mb-4 sm:-mt-4">
            <div className="mx-auto w-full max-w-4xl px-4 pt-5 md:px-6 md:pt-8">
                <Link
                    href="/pedidos"
                    className="flex w-fit items-center gap-1 text-sm font-medium text-tinta-suave hover:text-tinta"
                >
                    <ArrowBack sx={{ fontSize: 18 }} /> Meus pedidos
                </Link>
                <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                    {pedido ? `Pagamento do pedido #${pedido.codigo}` : "Pagamento do pedido"}
                </h1>

                {!dados && !erro && (
                    <div className="mt-10 flex justify-center" aria-busy="true">
                        <CircularProgress sx={{ color: "var(--primary)" }} aria-label="Carregando" />
                    </div>
                )}

                {erro !== null && !dados && <ErroAoCarregar erro={erro} logado={!!me} id={id} onTentar={carregar} />}

                {dados && pedido && (
                    <>
                        <p className="mt-1 text-sm text-tinta-suave">
                            {aguardando || aprovado
                                ? "O pedido vai para a cozinha assim que o pagamento for aprovado."
                                : "Este pedido não está esperando pagamento."}
                        </p>

                        <div className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
                            <div className="rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-black/5 md:order-2">
                                {aprovado ? (
                                    <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
                                        <CheckCircle sx={{ fontSize: 48 }} className="text-green-600" />
                                        <p className="font-display text-lg font-bold">Pagamento aprovado!</p>
                                        <p className="text-sm text-tinta-suave">
                                            Seu pedido já foi para a cozinha. Levando você para acompanhar o preparo…
                                        </p>
                                        <Link
                                            href={`/pedidos?destaque=${id}`}
                                            replace
                                            className="rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white"
                                        >
                                            Acompanhar pedido
                                        </Link>
                                    </div>
                                ) : aguardando ? (
                                    <PagamentoOnline pedido={pedido} gerarPixAoAbrir onAprovado={aprovar} />
                                ) : (
                                    <SemPagamento status={pedido.status} pago={pedido.pago} canal={pedido.canal} id={id} />
                                )}
                            </div>

                            <Resumo dados={dados} />
                        </div>

                        {aguardando && !aprovado && (
                            <button
                                type="button"
                                onClick={() => setConfirmarCancelamento(true)}
                                className="mt-4 text-xs font-semibold text-tinta-suave underline-offset-2 hover:underline"
                            >
                                Cancelar pedido
                            </button>
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
                            O pedido não será preparado e nada será cobrado.
                        </ConfirmDialog>
                    </>
                )}
            </div>
        </div>
    );
}

/** Itens, valores e entrega do pedido. */
function Resumo({ dados }: { dados: PedidoComDetalhe }) {
    const { pedido, detalhe } = dados;
    const Icone = ICONE_TIPO[pedido.tipo];
    const endereco = detalhe.address;
    const desconto = detalhe.discount ?? 0;
    const taxa = detalhe.deliveryFee ?? 0;

    return (
        <section aria-label="Resumo do pedido" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:order-1">
            <h2 className="font-display font-bold">Resumo</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-tinta-suave">
                <Icone sx={{ fontSize: 18 }} />
                {NOME_TIPO[pedido.tipo]}, {data(pedido.criadoEm)}
            </p>
            {endereco && (
                <p className="mt-1 text-sm text-tinta-suave">
                    {endereco.streetAddress}, {endereco.number}
                    {endereco.complement ? ` - ${endereco.complement}` : ""}
                    {endereco.neighborhood ? ` · ${endereco.neighborhood}` : ""}
                </p>
            )}

            <ul className="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3 text-sm">
                {(detalhe.items ?? []).map((item, i) => (
                    <li key={i} className="flex justify-between gap-3">
                        <span className="min-w-0">
                            <span className="font-semibold text-marca">{item.quantity}x</span> {item.name}
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
            </ul>

            <dl className="mt-3 flex flex-col gap-1 border-t border-black/5 pt-3 text-sm">
                {(desconto > 0 || taxa > 0) && (
                    <Linha rotulo="Subtotal" valor={formatCurrency(detalhe.subtotal ?? 0)} />
                )}
                {desconto > 0 && <Linha rotulo="Desconto" valor={`- ${formatCurrency(desconto)}`} />}
                {taxa > 0 && <Linha rotulo="Taxa de entrega" valor={formatCurrency(taxa)} />}
                <div className="flex justify-between font-display text-base font-extrabold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatCurrency(pedido.total)}</dd>
                </div>
            </dl>
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

/** O pedido não espera pagamento online: já pago, cancelado ou pago na entrega. */
function SemPagamento({
    status,
    pago,
    canal,
    id,
}: {
    status: string;
    pago: boolean;
    canal: string;
    id: number;
}) {
    const texto =
        status === "CANCELLED"
            ? "Este pedido foi cancelado."
            : pago
              ? "Este pedido já está pago."
              : canal !== "ONLINE"
                ? "Este pedido é pago na entrega ou no balcão."
                : "Este pedido não está esperando pagamento.";

    return (
        <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
            <p className="font-semibold">{texto}</p>
            <Link
                href={`/pedidos?destaque=${id}`}
                className="rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white"
            >
                Ver em Meus pedidos
            </Link>
        </div>
    );
}

function ErroAoCarregar({
    erro,
    logado,
    id,
    onTentar,
}: {
    erro: unknown;
    logado: boolean;
    id: number;
    onTentar: () => void;
}) {
    // 401/403/404: o pedido não é deste aparelho ou desta conta.
    const semAcesso = erro instanceof ApiError && [401, 403, 404].includes(erro.status);

    return (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-white px-6 py-10 text-center ring-1 ring-black/5">
            <ErrorOutlined className="text-tinta-suave" />
            <p className="font-semibold">
                {semAcesso ? "Não encontramos este pedido" : "Não foi possível carregar o pedido"}
            </p>
            <p className="text-sm text-tinta-suave">
                {semAcesso
                    ? logado
                        ? "Ele não é da sua conta."
                        : "Ele não foi feito neste aparelho. Se foi pela sua conta, entre para pagar."
                    : mensagemDeErro(erro)}
            </p>
            <div className="mt-2 flex gap-2">
                {semAcesso && !logado && (
                    <Link
                        href={linkDeAcesso("/login", `/pedidos/${id}/pagamento`)}
                        className="rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white"
                    >
                        Entrar
                    </Link>
                )}
                {!semAcesso && (
                    <button
                        type="button"
                        onClick={onTentar}
                        className="rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white"
                    >
                        Tentar de novo
                    </button>
                )}
                <Link href="/pedidos" className="rounded-full px-5 py-2 text-sm font-semibold text-tinta ring-1 ring-black/10">
                    Meus pedidos
                </Link>
            </div>
        </div>
    );
}
