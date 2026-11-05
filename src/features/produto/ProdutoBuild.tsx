"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowBack, Close } from "@mui/icons-material";

import { useToast } from "@/src/components/feedback/ToastProvider";
import ImagemItem from "@/src/features/menu/components/ImagemItem";
import { adicionarAoCarrinho } from "@/src/lib/carrinho";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    buscarDetalheCombo,
    buscarDetalheProduto,
    type DetalheCombo,
    type DetalheItem,
    type DetalheProduto,
} from "@/src/services/detalheItem";

import Contador from "./components/Contador";
import SecaoAdicionais from "./components/SecaoAdicionais";
import SeletorTamanho from "./components/SeletorTamanho";

const MAXIMO_POR_ITEM = 20;
const LIMITE_OBSERVACAO = 140;

interface ProdutoBuildProps {
    id: number;
    combo: boolean;
    promocaoId: number | null;
}

type Estado =
    | { tipo: "carregando" }
    | { tipo: "erro"; mensagem: string }
    | { tipo: "indisponivel" }
    | { tipo: "pronto"; item: DetalheItem };

export default function ProdutoBuild({ id, combo, promocaoId }: ProdutoBuildProps) {
    const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
    const [tentativa, setTentativa] = useState(0);

    useEffect(() => {
        let cancelado = false;

        // Id inválido na URL (ex.: /menu/produto/abc): nem chama o backend.
        const busca: Promise<DetalheItem | null> = !Number.isInteger(id) || id <= 0
            ? Promise.resolve(null)
            : combo
              ? buscarDetalheCombo(id)
              : buscarDetalheProduto(id, promocaoId);

        busca
            .then((item) => {
                if (!cancelado) {
                    setEstado(item ? { tipo: "pronto", item } : { tipo: "indisponivel" });
                }
            })
            .catch((erro) => {
                if (!cancelado) {
                    setEstado({ tipo: "erro", mensagem: mensagemDeErro(erro) });
                }
            });

        return () => {
            cancelado = true;
        };
    }, [id, combo, promocaoId, tentativa]);

    if (estado.tipo === "carregando") {
        return <Carregando />;
    }

    if (estado.tipo === "erro") {
        return (
            <Aviso
                titulo="Não foi possível carregar este item"
                texto={estado.mensagem}
                acao={{
                    label: "Tentar de novo",
                    onClick: () => {
                        setEstado({ tipo: "carregando" });
                        setTentativa((t) => t + 1);
                    },
                }}
            />
        );
    }

    if (estado.tipo === "indisponivel") {
        return (
            <Aviso
                titulo="Este item não está disponível"
                texto="Ele pode ter saído do cardápio ou estar esgotado no momento."
            />
        );
    }

    return estado.item.tipo === "COMBO" ? (
        <TelaCombo combo={estado.item} />
    ) : (
        // A key reinicia as escolhas se a pessoa navegar para outro produto.
        <TelaProduto key={estado.item.id} produto={estado.item} />
    );
}

/* ---------- Produto (e produto em promoção) ---------- */

function TelaProduto({ produto }: { produto: DetalheProduto }) {
    const router = useRouter();
    const toast = useToast();

    // Começa no tamanho mais barato (a lista já vem ordenada por preço).
    const [tamanhoId, setTamanhoId] = useState(produto.tamanhos[0].productSizeId);
    const [adicionais, setAdicionais] = useState<Record<number, number>>({});
    const [removidos, setRemovidos] = useState<number[]>([]);
    const [observacao, setObservacao] = useState("");
    const [quantidade, setQuantidade] = useState(1);
    const [adicionaisAbertos, setAdicionaisAbertos] = useState(false);

    const tamanho = produto.tamanhos.find((t) => t.productSizeId === tamanhoId) ?? produto.tamanhos[0];

    const escolhidos = useMemo(
        () =>
            produto.adicionais
                .filter((a) => (adicionais[a.ingredientId] ?? 0) > 0)
                .map((a) => ({
                    ingredientId: a.ingredientId,
                    nome: a.nome,
                    preco: a.preco,
                    quantidade: adicionais[a.ingredientId],
                })),
        [produto.adicionais, adicionais]
    );

    const precoUnidade =
        tamanho.preco + escolhidos.reduce((t, a) => t + a.preco * a.quantidade, 0);
    const total = precoUnidade * quantidade;

    const alternarRemovido = (ingredientId: number) =>
        setRemovidos((atual) =>
            atual.includes(ingredientId)
                ? atual.filter((r) => r !== ingredientId)
                : [...atual, ingredientId]
        );

    const adicionar = () => {
        adicionarAoCarrinho({
            tipo: "PRODUCT",
            productId: produto.id,
            productSizeId: tamanho.productSizeId,
            tamanho: produto.tamanhos.length > 1 ? tamanho.nome : null,
            promocaoId: produto.promocao?.id ?? null,
            nome: produto.nome,
            imagem: produto.imagem,
            precoUnitario: tamanho.preco,
            quantidade,
            observacao: observacao.trim(),
            adicionais: escolhidos,
            removidos: produto.ingredientes.filter((i) => removidos.includes(i.ingredientId)),
        });

        toast.success(`${produto.nome} adicionado ao carrinho.`);
        router.push("/menu");
    };

    return (
        <Estrutura
            imagem={produto.imagem}
            nome={produto.nome}
            selo={
                produto.promocao ? (
                    <Selo cor="vermelho">
                        {produto.promocao.desconto > 0 ? `-${produto.promocao.desconto}%` : "Promoção"}
                    </Selo>
                ) : null
            }
            rodape={
                <BarraAdicionar
                    quantidade={quantidade}
                    onQuantidade={setQuantidade}
                    total={total}
                    onAdicionar={adicionar}
                />
            }
        >
            <Topo
                esquerda={
                    <Cabecalho
                        titulo={produto.nome}
                        subtitulo={produto.promocao?.titulo || null}
                        descricao={produto.descricao}
                    />
                }
            >
            <Campo titulo="Tamanho">
                <SeletorTamanho
                    tamanhos={produto.tamanhos}
                    selecionado={tamanho.productSizeId}
                    onChange={setTamanhoId}
                />
            </Campo>

            {produto.ingredientes.length > 0 && (
                <Campo titulo="Ingredientes" dica="Toque para tirar algum">
                    <div className="flex flex-wrap gap-2">
                        {produto.ingredientes.map((ingrediente) => {
                            const removido = removidos.includes(ingrediente.ingredientId);

                            return (
                                <button
                                    key={ingrediente.ingredientId}
                                    type="button"
                                    onClick={() => alternarRemovido(ingrediente.ingredientId)}
                                    aria-pressed={removido}
                                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition ${
                                        removido
                                            ? "bg-neutral-100 text-neutral-400 line-through ring-1 ring-neutral-200"
                                            : "bg-white text-neutral-800 ring-1 ring-black/15 hover:ring-black/30"
                                    }`}
                                >
                                    {removido && <Close sx={{ fontSize: 14 }} />}
                                    {removido
                                        ? `Sem ${ingrediente.nome.charAt(0).toLowerCase()}${ingrediente.nome.slice(1)}`
                                        : ingrediente.nome}
                                </button>
                            );
                        })}
                    </div>
                </Campo>
            )}
            </Topo>

            <SecaoAdicionais
                adicionais={produto.adicionais}
                quantidades={adicionais}
                onChange={(ingredientId, q) =>
                    setAdicionais((atual) => ({ ...atual, [ingredientId]: q }))
                }
                aberto={adicionaisAbertos}
                onAlternar={() => setAdicionaisAbertos((a) => !a)}
            />

            <Observacao valor={observacao} onChange={setObservacao} />
        </Estrutura>
    );
}

/* ---------- Combo ---------- */

function TelaCombo({ combo }: { combo: DetalheCombo }) {
    const router = useRouter();
    const toast = useToast();
    const [observacao, setObservacao] = useState("");
    const [quantidade, setQuantidade] = useState(1);

    const adicionar = () => {
        adicionarAoCarrinho({
            tipo: "COMBO",
            comboId: combo.id,
            nome: combo.nome,
            imagem: combo.imagem,
            precoUnitario: combo.preco,
            quantidade,
            observacao: observacao.trim(),
        });

        toast.success(`${combo.nome} adicionado ao carrinho.`);
        router.push("/menu");
    };

    return (
        <Estrutura
            imagem={combo.imagem}
            nome={combo.nome}
            selo={<Selo cor="preto">Combo</Selo>}
            rodape={
                <BarraAdicionar
                    quantidade={quantidade}
                    onQuantidade={setQuantidade}
                    total={combo.preco * quantidade}
                    onAdicionar={adicionar}
                />
            }
        >
            <Topo
                esquerda={
                    <div className="flex flex-col gap-4">
                        <Cabecalho
                            titulo={combo.nome}
                            subtitulo={combo.validoAte ? `Válido até ${formatDate(combo.validoAte)}` : null}
                            descricao={combo.descricao}
                        />
                        <p className="text-2xl font-bold md:text-3xl">{formatCurrency(combo.preco)}</p>
                    </div>
                }
            >
            <Campo titulo="Neste combo">
                <ul className="divide-y divide-neutral-100 rounded-xl bg-neutral-50 px-4 ring-1 ring-black/5">
                    {combo.itens.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 py-3">
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-(--primary) ring-1 ring-black/10">
                                {item.quantidade}x
                            </span>
                            <span className="flex-1">{item.nome}</span>
                            {item.tamanho && (
                                <span className="text-sm text-neutral-500">{item.tamanho}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </Campo>
            </Topo>

            <Observacao valor={observacao} onChange={setObservacao} />
        </Estrutura>
    );
}

/* ---------- Peças compartilhadas ---------- */

/** No celular, tudo empilhado. A partir de md: texto à esquerda e as escolhas à direita. */
function Topo({ esquerda, children }: { esquerda: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-12 lg:gap-16">
            <div>{esquerda}</div>
            <div className="flex flex-col gap-6">{children}</div>
        </div>
    );
}

function useVoltar() {
    const router = useRouter();

    // Volta para onde a pessoa estava; se abriu o link direto, vai para o cardápio.
    return () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/menu");
        }
    };
}

function Estrutura({
    imagem,
    nome,
    selo,
    rodape,
    children,
}: {
    imagem: string | null;
    nome: string;
    selo: React.ReactNode;
    rodape: React.ReactNode;
    children: React.ReactNode;
}) {
    const voltar = useVoltar();

    return (
        // Largura total em qualquer tela. pb-32 deixa espaço para a barra fixa de adicionar.
        <div className="-mx-2 -mb-2 -mt-2 min-h-[calc(100dvh-5rem)] bg-white pb-32 text-neutral-900 sm:-mx-4 sm:-mb-4 sm:-mt-4">
            {/* Foto: 4:3 no celular; banner de altura fixa a partir de md. */}
            <div className="relative">
                <ImagemItem
                    src={imagem}
                    alt={nome}
                    className="aspect-[4/3] max-h-[48vh] w-full md:aspect-auto md:h-[320px] md:max-h-none lg:h-[380px]"
                />

                <button
                    type="button"
                    onClick={voltar}
                    aria-label="Voltar"
                    className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-md backdrop-blur transition hover:bg-white active:scale-95 md:left-8 md:top-6 md:h-11 md:w-11 xl:left-12"
                >
                    <ArrowBack fontSize="small" />
                </button>

                {selo && (
                    <div className="absolute right-3 top-3 md:right-8 md:top-6 xl:right-12">{selo}</div>
                )}
            </div>

            {/* Sem overflow-hidden: ele quebraria o cabeçalho fixo (sticky) dos adicionais. */}
            <div className="relative -mt-6 flex flex-col gap-6 rounded-t-3xl bg-white px-4 pt-6 md:gap-8 md:px-8 md:pt-8 xl:px-12">
                {children}
            </div>

            {rodape}
        </div>
    );
}

function Cabecalho({
    titulo,
    subtitulo,
    descricao,
}: {
    titulo: string;
    subtitulo: string | null;
    descricao: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            {subtitulo && (
                <p className="text-xs font-semibold uppercase tracking-wide text-(--primary)">
                    {subtitulo}
                </p>
            )}
            <h1 className="text-2xl font-bold leading-tight tracking-tight md:text-3xl">{titulo}</h1>
            {descricao && <p className="leading-relaxed text-neutral-600">{descricao}</p>}
        </div>
    );
}

function Campo({
    titulo,
    dica,
    children,
}: {
    titulo: string;
    dica?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-bold">{titulo}</h2>
                {dica && <span className="text-xs text-neutral-500">{dica}</span>}
            </div>
            {children}
        </div>
    );
}

function Selo({ cor, children }: { cor: "vermelho" | "preto"; children: React.ReactNode }) {
    return (
        <span
            className={`rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide text-white shadow-md ${
                cor === "vermelho" ? "bg-(--primary)" : "bg-neutral-900"
            }`}
        >
            {children}
        </span>
    );
}

function Observacao({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
    return (
        <Campo titulo="Observação" dica={`${valor.length}/${LIMITE_OBSERVACAO}`}>
            <textarea
                value={valor}
                onChange={(e) => onChange(e.target.value.slice(0, LIMITE_OBSERVACAO))}
                rows={2}
                placeholder="Ex.: bem passado, cortar ao meio..."
                aria-label="Observação"
                className="w-full resize-none rounded-xl bg-white px-4 py-3 text-base ring-1 ring-black/15 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-(--primary)"
            />
        </Campo>
    );
}

function BarraAdicionar({
    quantidade,
    onQuantidade,
    total,
    onAdicionar,
}: {
    quantidade: number;
    onQuantidade: (q: number) => void;
    total: number;
    onAdicionar: () => void;
}) {
    return (
        // Fixa no rodapé da tela em qualquer tamanho. No PC, quantidade e botão ficam à direita.
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:justify-end md:gap-6 md:px-8 md:py-4 xl:px-12">
            <Contador
                valor={quantidade}
                min={1}
                max={MAXIMO_POR_ITEM}
                onChange={onQuantidade}
                rotulo="quantidade"
                tamanho="md"
            />

            <button
                type="button"
                onClick={onAdicionar}
                className="flex h-12 flex-1 items-center justify-between gap-3 rounded-xl bg-(--primary) px-5 font-semibold text-white shadow-md shadow-red-600/30 transition hover:bg-[#d92628] active:scale-[0.98] md:w-96 md:flex-none"
            >
                <span>Adicionar</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
            </button>
        </div>
    );
}

function Carregando() {
    return (
        <div className="-mx-2 -mt-2 sm:-mx-4 sm:-mt-4" aria-busy="true" aria-label="Carregando item">
            <div className="aspect-[4/3] max-h-[48vh] w-full animate-pulse bg-neutral-200 md:aspect-auto md:h-[320px] md:max-h-none lg:h-[380px]" />
            <div className="flex flex-col gap-4 px-4 pt-6 md:max-w-xl md:px-8 xl:px-12">
                <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
                <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-neutral-200" />
                <div className="h-14 w-full animate-pulse rounded-xl bg-neutral-100" />
            </div>
        </div>
    );
}

function Aviso({
    titulo,
    texto,
    acao,
}: {
    titulo: string;
    texto: string;
    acao?: { label: string; onClick: () => void };
}) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-6 py-16 text-center text-neutral-900">
            <h1 className="text-lg font-semibold">{titulo}</h1>
            <p className="text-sm text-neutral-500">{texto}</p>

            <div className="mt-4 flex gap-3">
                {acao && (
                    <button
                        type="button"
                        onClick={acao.onClick}
                        className="rounded-full bg-(--primary) px-5 py-2 text-sm font-semibold text-white"
                    >
                        {acao.label}
                    </button>
                )}
                <Link
                    href="/menu"
                    className="rounded-full px-5 py-2 text-sm font-semibold text-neutral-700 ring-1 ring-black/15"
                >
                    Voltar ao cardápio
                </Link>
            </div>
        </div>
    );
}
