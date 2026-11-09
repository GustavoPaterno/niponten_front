"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCartOutlined } from "@mui/icons-material";

import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import {
    limparCarrinho,
    quantidadeTotal,
    totalDoItem,
    useCarrinho,
    type ItemCarrinho,
} from "@/src/lib/carrinho";
import { cotarCarrinho, type Cotacao } from "@/src/services/cotacao";

import FinalizarPedidoDialog from "./components/FinalizarPedidoDialog";
import LinhaCarrinho from "./components/LinhaCarrinho";
import ResumoCarrinho from "./components/ResumoCarrinho";

// Espera depois da última mudança antes de recotar (ex.: vários cliques no +).
const ESPERA_COTACAO_MS = 400;

// `para` guarda os itens que foram cotados: se o carrinho mudou depois, a cotação está velha.
type EstadoCotacao =
    | { tipo: "conferindo" }
    | { tipo: "pronta"; cotacao: Cotacao; para: ItemCarrinho[] }
    | { tipo: "falhou"; para: ItemCarrinho[] };

// O carrinho vem do localStorage, que só existe no navegador: até lá, mostra o carregamento.
const naoAssina = () => () => {};
function useNoNavegador() {
    return useSyncExternalStore(naoAssina, () => true, () => false);
}

export default function CarrinhoBuild() {
    const noNavegador = useNoNavegador();
    const itens = useCarrinho();
    const [estado, setEstado] = useState<EstadoCotacao>({ tipo: "conferindo" });
    const [confirmarLimpar, setConfirmarLimpar] = useState(false);
    const [finalizando, setFinalizando] = useState(false);
    const router = useRouter();
    const toast = useToast();

    useEffect(() => {
        if (itens.length === 0) {
            return;
        }

        let cancelado = false;
        const timer = setTimeout(() => {
            cotarCarrinho(itens)
                .then((cotacao) => {
                    if (!cancelado) {
                        setEstado({ tipo: "pronta", cotacao, para: itens });
                    }
                })
                .catch(() => {
                    if (!cancelado) {
                        setEstado({ tipo: "falhou", para: itens });
                    }
                });
        }, ESPERA_COTACAO_MS);

        return () => {
            cancelado = true;
            clearTimeout(timer);
        };
    }, [itens]);

    if (!noNavegador) {
        return <Carregando />;
    }

    if (itens.length === 0) {
        return <Vazio />;
    }

    const cotacao = estado.tipo === "pronta" ? estado.cotacao : null;
    // Cotação de uma versão anterior do carrinho (ex.: logo depois de um +): ainda conferindo.
    const conferindo = estado.tipo === "conferindo" || estado.para !== itens;
    const falhou = estado.tipo === "falhou" && !conferindo;

    const problemas = cotacao?.problemas ?? {};
    const qtdComProblema = itens.filter((i) => problemas[i.chave]).length;

    // Valor de cada linha: preço oficial por unidade quando já existe (recalculado na hora para a
    // quantidade atual), senão o preço guardado no carrinho. Itens recusados não entram.
    const totalDaLinha = (item: ItemCarrinho) => {
        const oficial = cotacao?.itens[item.chave];

        return oficial ? oficial.precoUnitario * item.quantidade : totalDoItem(item);
    };
    const somaAtual = itens
        .filter((item) => !problemas[item.chave])
        .reduce((t, item) => t + totalDaLinha(item), 0);

    const subtotal = cotacao && !conferindo ? cotacao.subtotal : somaAtual;
    const total = cotacao && !conferindo ? cotacao.total : somaAtual;

    const aviso = conferindo
        ? "Conferindo preços..."
        : falhou
          ? "Não foi possível conferir os preços agora. Os valores podem mudar no pedido."
          : qtdComProblema > 0
            ? `${qtdComProblema === 1 ? "1 item precisa" : `${qtdComProblema} itens precisam`} de ajuste e não ${qtdComProblema === 1 ? "entra" : "entram"} no total.`
            : null;

    const quantidade = quantidadeTotal(itens);

    return (
        // pb-80 no celular: espaço para o resumo fixo no rodapé.
        <div className="-mx-2 -mb-2 -mt-2 min-h-[calc(100dvh-5rem)] bg-neutral-50 pb-80 text-neutral-900 sm:-mx-4 sm:-mb-4 sm:-mt-4 lg:pb-12">
            <div className="px-4 pt-5 md:px-8 md:pt-8 xl:px-12">
                <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Seu carrinho</h1>
                        <p className="text-sm text-neutral-500">
                            {quantidade} {quantidade === 1 ? "item" : "itens"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setConfirmarLimpar(true)}
                        className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-500 transition hover:bg-white hover:text-(--primary)"
                    >
                        Limpar carrinho
                    </button>
                </div>

                <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
                    <ul className="divide-y divide-neutral-100 rounded-2xl bg-white px-4 ring-1 ring-black/5 md:px-6">
                        {itens.map((item) => (
                            <LinhaCarrinho
                                key={item.chave}
                                item={item}
                                cotacao={cotacao?.itens[item.chave]}
                                problemas={problemas[item.chave]}
                            />
                        ))}
                    </ul>

                    {/* Resumo: fixo no rodapé até lg; a partir de lg, coluna à direita que acompanha a rolagem. */}
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:px-8 lg:sticky lg:top-28 lg:z-0 lg:rounded-2xl lg:border-0 lg:p-6 lg:shadow-sm lg:ring-1 lg:ring-black/5">
                        <div className="mx-auto md:max-w-xl lg:max-w-none">
                            <ResumoCarrinho
                                subtotal={subtotal}
                                total={total}
                                conferindo={conferindo}
                                aviso={aviso}
                                // Só depois de conferir os preços e sem itens recusados pelo backend.
                                podePedir={!conferindo && qtdComProblema === 0}
                                onPedir={() => setFinalizando(true)}
                            />
                        </div>
                    </div>
                </div>

                <Link
                    href="/menu"
                    className="mt-4 inline-flex rounded-full px-3 py-2 text-sm font-semibold text-(--primary) transition hover:bg-white"
                >
                    + Adicionar mais itens
                </Link>
            </div>

            <FinalizarPedidoDialog
                open={finalizando}
                itens={itens}
                total={total}
                onFechar={() => setFinalizando(false)}
                onCriado={(pedido) => {
                    limparCarrinho();
                    setFinalizando(false);
                    toast.success(`Pedido #${pedido.codigo} enviado! Acompanhe por aqui.`);
                    router.push("/pedidos");
                }}
            />

            <ConfirmDialog
                open={confirmarLimpar}
                title="Limpar carrinho"
                confirmText="Limpar"
                danger
                onConfirm={() => {
                    limparCarrinho();
                    setConfirmarLimpar(false);
                }}
                onCancel={() => setConfirmarLimpar(false)}
            >
                <p>Remover todos os itens do carrinho?</p>
            </ConfirmDialog>
        </div>
    );
}

function Vazio() {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-20 text-center text-neutral-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-(--primary)">
                <ShoppingCartOutlined fontSize="large" />
            </div>
            <h1 className="text-xl font-bold">Seu carrinho está vazio</h1>
            <p className="text-sm text-neutral-500">
                Escolha um pastel, um combo ou uma promoção no cardápio.
            </p>
            <Link
                href="/menu"
                className="mt-2 rounded-full bg-(--primary) px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/30"
            >
                Ver cardápio
            </Link>
        </div>
    );
}

function Carregando() {
    return (
        <div className="flex flex-col gap-3 px-2 pt-5 md:px-6" aria-busy="true" aria-label="Carregando carrinho">
            <div className="h-7 w-48 animate-pulse rounded bg-neutral-200" />
            {[0, 1].map((i) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
                    <div className="h-20 w-20 animate-pulse rounded-xl bg-neutral-200" />
                    <div className="flex flex-1 flex-col gap-2">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}
