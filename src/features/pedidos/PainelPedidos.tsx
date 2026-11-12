"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Chip, InputAdornment, MenuItem, Tab, Tabs, TextField } from "@mui/material";
import { HistoryOutlined, Search, SwapVert } from "@mui/icons-material";

import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    ETAPAS_ATIVAS,
    NOME_STATUS,
    avancarPedido,
    listarPedidosAtivos,
    proximaEtapa,
    type Pedido,
    type StatusPedido,
} from "@/src/services/pedidos";

import CardPedido from "./components/CardPedido";
import DetalhePedido from "./components/DetalhePedido";
import { VERMELHO, campoArredondado, menuSuspenso } from "./estilosMui";

type Ordem = "recentes" | "antigos";

const ORDENS: { valor: Ordem; label: string }[] = [
    { valor: "recentes", label: "Mais recentes primeiro" },
    { valor: "antigos", label: "Mais antigos primeiro" },
];

// O "Novo" some sozinho depois desse tempo (ou ao abrir o pedido).
const DESTAQUE_NOVO_MS = 2 * 60_000;
// Reserva: se os eventos caírem, a lista ainda se atualiza a cada minuto.
const ATUALIZACAO_RESERVA_MS = 60_000;

function normalizar(texto: string): string {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export default function PainelPedidos() {
    const toast = useToast();
    const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [busca, setBusca] = useState("");
    const [ordem, setOrdem] = useState<Ordem>("recentes");
    const [aba, setAba] = useState<StatusPedido>("PENDING");
    const [aberto, setAberto] = useState<number | null>(null);
    const [avancando, setAvancando] = useState<number | null>(null);
    const [novos, setNovos] = useState<Set<number>>(new Set());
    const [agora, setAgora] = useState(() => Date.now());

    const recarregar = useCallback(() => {
        listarPedidosAtivos()
            .then((lista) => {
                setPedidos(lista);
                setErro(null);
            })
            .catch((e) => setErro(mensagemDeErro(e)));
    }, []);

    // Agrupa vários eventos seguidos numa recarga só.
    const timerRecarga = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recarregarEmBreve = useCallback(() => {
        if (timerRecarga.current) {
            clearTimeout(timerRecarga.current);
        }

        timerRecarga.current = setTimeout(recarregar, 300);
    }, [recarregar]);

    // Carga inicial + reserva periódica + relógio dos tempos.
    useEffect(() => {
        const inicial = setTimeout(recarregar, 0);
        const reserva = setInterval(recarregar, ATUALIZACAO_RESERVA_MS);
        const relogio = setInterval(() => setAgora(Date.now()), 30_000);

        return () => {
            clearTimeout(inicial);
            clearInterval(reserva);
            clearInterval(relogio);
        };
    }, [recarregar]);

    // Tempo real: GET /orders/events (Server-Sent Events) pelo proxy, que envia o login.
    useEffect(() => {
        // Se a conexão cair, o navegador reconecta sozinho; enquanto isso vale a atualização de reserva.
        const fonte = new EventSource("/backend/orders/events");

        fonte.onmessage = (mensagem) => {
            try {
                const evento = JSON.parse(mensagem.data) as { type?: string; orderId?: number };

                if (evento.type === "CREATED" && evento.orderId) {
                    const novoId = evento.orderId;

                    setNovos((atual) => new Set(atual).add(novoId));
                    setTimeout(
                        () =>
                            setNovos((atual) => {
                                const sem = new Set(atual);
                                sem.delete(novoId);
                                return sem;
                            }),
                        DESTAQUE_NOVO_MS
                    );
                }
            } catch {
                // Evento sem JSON: só recarrega.
            }

            recarregarEmBreve();
        };

        return () => fonte.close();
    }, [recarregarEmBreve]);

    // O número de novos aparece no título da aba do navegador.
    useEffect(() => {
        const qtdNovos = pedidos?.filter((p) => p.status === "PENDING").length ?? 0;
        document.title = qtdNovos > 0 ? `(${qtdNovos}) Pedidos · Marusan` : "Pedidos · Marusan";

        return () => {
            document.title = "Marusan";
        };
    }, [pedidos]);

    const termo = normalizar(busca.replace(/^#/, ""));

    const porEtapa = useMemo(() => {
        const filtrados = (pedidos ?? []).filter(
            (p) => !termo || normalizar(p.codigo).includes(termo) || normalizar(p.cliente).includes(termo)
        );
        const ordenados = [...filtrados].sort((a, b) => {
            const diff = new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
            return ordem === "antigos" ? diff : -diff;
        });

        return Object.fromEntries(
            ETAPAS_ATIVAS.map((e) => [e.status, ordenados.filter((p) => p.status === e.status)])
        ) as Record<StatusPedido, Pedido[]>;
    }, [pedidos, termo, ordem]);

    const abrir = (pedido: Pedido) => {
        setAberto(pedido.id);
        setNovos((atual) => {
            const sem = new Set(atual);
            sem.delete(pedido.id);
            return sem;
        });
    };

    const avancar = async (pedido: Pedido) => {
        const proxima = proximaEtapa(pedido.status, pedido.tipo);

        if (!proxima) {
            return;
        }

        setAvancando(pedido.id);

        try {
            await avancarPedido(pedido.id, proxima.status);
            // Atualiza na hora, sem esperar o evento do backend.
            setPedidos((atual) =>
                (atual ?? [])
                    .map((p) => (p.id === pedido.id ? { ...p, status: proxima.status } : p))
                    .filter((p) => ETAPAS_ATIVAS.some((e) => e.status === p.status))
            );
            toast.success(`Pedido #${pedido.codigo}: ${NOME_STATUS[proxima.status].toLowerCase()}.`);
        } catch (e) {
            toast.error(mensagemDeErro(e));
            recarregar();
        } finally {
            setAvancando(null);
        }
    };

    const coluna = (status: StatusPedido) => {
        const lista = porEtapa[status] ?? [];

        if (lista.length === 0) {
            return (
                <p className="rounded-xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-sm text-tinta-suave/70">
                    {termo ? "Nenhum pedido encontrado" : "Nenhum pedido aqui"}
                </p>
            );
        }

        return lista.map((pedido) => (
            <CardPedido
                key={pedido.id}
                pedido={pedido}
                agora={agora}
                novo={novos.has(pedido.id)}
                avancando={avancando === pedido.id}
                onAbrir={() => abrir(pedido)}
                onAvancar={() => avancar(pedido)}
            />
        ));
    };

    return (
        <div className="-mx-2 -mb-2 -mt-2 flex min-h-[calc(100dvh-4rem)] flex-col bg-chapa text-tinta sm:-mx-4 sm:-mb-4 sm:-mt-4">
            {/* Barra superior: título, busca, ordem e histórico. */}
            <div className="flex flex-col gap-3 px-4 pb-3 pt-5 md:px-8 md:pt-6 lg:flex-row lg:items-center lg:justify-between xl:px-12">
                <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Pedidos</h1>

                <div className="flex flex-wrap items-center gap-2">
                    <TextField
                        size="small"
                        type="search"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar código ou nome"
                        className="w-full sm:w-72"
                        sx={campoArredondado}
                        slotProps={{
                            htmlInput: { "aria-label": "Buscar pedido por código ou nome" },
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" className="text-tinta-suave/70" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    <TextField
                        select
                        size="small"
                        value={ordem}
                        onChange={(e) => setOrdem(e.target.value as Ordem)}
                        className="min-w-0 flex-1 sm:w-60 sm:flex-none"
                        sx={campoArredondado}
                        slotProps={{
                            htmlInput: { "aria-label": "Ordenar pedidos" },
                            select: {
                                MenuProps: menuSuspenso,
                                renderValue: (valor) => (
                                    <span className="flex items-center gap-2">
                                        <SwapVert fontSize="small" className="text-tinta-suave/70" />
                                        {ORDENS.find((o) => o.valor === valor)?.label}
                                    </span>
                                ),
                            },
                        }}
                    >
                        {ORDENS.map((o) => (
                            <MenuItem key={o.valor} value={o.valor}>
                                {o.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Link
                        href="/admin/historico"
                        className="flex h-10 items-center gap-1.5 rounded-full bg-tinta px-4 text-sm font-semibold text-white hover:bg-black"
                    >
                        <HistoryOutlined fontSize="small" />
                        Histórico
                    </Link>
                </div>
            </div>

            {erro && !pedidos && (
                <div className="mx-4 mt-6 rounded-2xl bg-white px-6 py-10 text-center ring-1 ring-black/5 md:mx-8">
                    <p className="font-semibold">Não foi possível carregar os pedidos</p>
                    <p className="mt-1 text-sm text-tinta-suave">{erro}</p>
                    <button
                        type="button"
                        onClick={recarregar}
                        className="mt-4 rounded-full bg-marca px-5 py-2 text-sm font-semibold text-white"
                    >
                        Tentar de novo
                    </button>
                </div>
            )}

            {!pedidos && !erro && (
                <div className="grid gap-4 px-4 md:px-8 lg:grid-cols-4 xl:px-12" aria-busy="true">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-64 animate-pulse rounded-2xl bg-black/10" />
                    ))}
                </div>
            )}

            {pedidos && (
                <>
                    {/* Celular e tablet: abas com contador, uma etapa por vez. */}
                    <div className="sticky top-16 z-10 bg-chapa/95 px-2 backdrop-blur md:px-6 lg:hidden">
                        <Tabs
                            value={aba}
                            onChange={(_, valor: StatusPedido) => setAba(valor)}
                            variant="fullWidth"
                            aria-label="Etapas"
                            sx={{
                                minHeight: 52,
                                borderBottom: "1px solid rgba(0,0,0,0.08)",
                                "& .MuiTabs-indicator": { backgroundColor: VERMELHO, height: 3, borderRadius: 3 },
                                "& .MuiTab-root": {
                                    minHeight: 52,
                                    minWidth: 0,
                                    px: 0.5,
                                    textTransform: "none",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "rgba(0,0,0,0.5)",
                                },
                                "& .MuiTab-root.Mui-selected": { color: "#171717" },
                            }}
                        >
                            {ETAPAS_ATIVAS.map((etapa) => {
                                const qtd = porEtapa[etapa.status]?.length ?? 0;
                                const destaque = qtd > 0 && etapa.status === "PENDING";

                                return (
                                    <Tab
                                        key={etapa.status}
                                        value={etapa.status}
                                        label={
                                            <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1.5">
                                                {etapa.curto}
                                                <Chip
                                                    label={qtd}
                                                    size="small"
                                                    sx={{
                                                        height: 18,
                                                        minWidth: 22,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        "& .MuiChip-label": { px: 0.75 },
                                                        backgroundColor: destaque ? VERMELHO : "rgba(0,0,0,0.08)",
                                                        color: destaque ? "#fff" : "rgba(0,0,0,0.6)",
                                                    }}
                                                />
                                            </span>
                                        }
                                    />
                                );
                            })}
                        </Tabs>
                    </div>
                    <div className="h-3 lg:hidden" />

                    <div className="flex flex-col gap-3 px-4 pb-8 md:px-8 lg:hidden" role="tabpanel">
                        {coluna(aba)}
                    </div>

                    {/* PC: as quatro etapas lado a lado, cada coluna rola sozinha. */}
                    <div className="hidden flex-1 gap-4 px-8 pb-8 lg:grid lg:grid-cols-4 xl:px-12">
                        {ETAPAS_ATIVAS.map((etapa) => {
                            const qtd = porEtapa[etapa.status]?.length ?? 0;

                            return (
                                <section
                                    key={etapa.status}
                                    aria-label={etapa.titulo}
                                    className="flex max-h-[calc(100dvh-13rem)] min-h-64 flex-col rounded-2xl bg-chapa ring-1 ring-black/5"
                                >
                                    <header className="flex items-center justify-between px-4 pb-2 pt-3">
                                        <h2 className="font-display text-sm font-bold text-tinta-suave">
                                            {etapa.titulo}
                                        </h2>
                                        <span
                                            className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                                                qtd > 0 && etapa.status === "PENDING"
                                                    ? "bg-marca text-white"
                                                    : "bg-white text-tinta-suave"
                                            }`}
                                        >
                                            {qtd}
                                        </span>
                                    </header>
                                    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3">
                                        {coluna(etapa.status)}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </>
            )}

            <DetalhePedido id={aberto} onFechar={() => setAberto(null)} onAlterado={recarregar} />
        </div>
    );
}
