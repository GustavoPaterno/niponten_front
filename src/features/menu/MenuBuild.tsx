"use client";

import { useEffect, useMemo, useState } from "react";
import { Close, Search } from "@mui/icons-material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { mensagemDeErro } from "@/src/lib/http";
import { buscarCardapio, type Cardapio } from "@/src/services/cardapio";

import {
    CardCombo,
    CardEsqueleto,
    CardPromocao,
    LinhaEsqueleto,
    LinhaProduto,
} from "./components/Cards";

// Margem lateral: cresce com a tela para o conteúdo não colar nas bordas.
const PX = "px-4 md:px-8 xl:px-12";
const MX = "mx-4 md:mx-8 xl:mx-12";
// No celular: carrossel horizontal. A partir de md: grade que usa a largura toda.
const GRADE =
    "md:grid md:grid-cols-3 md:gap-5 md:overflow-visible lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

type Estado =
    | { tipo: "carregando" }
    | { tipo: "erro"; mensagem: string }
    | { tipo: "pronto"; cardapio: Cardapio };

/** "Pastel de Frango" -> "pastel de frango"; ignora acentos e maiúsculas na busca. */
function normalizar(texto: string): string {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function combina(busca: string, ...campos: string[]): boolean {
    return campos.some((campo) => normalizar(campo).includes(busca));
}

export default function MenuBuild() {
    const { me } = useSessao();
    const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
    const [tentativa, setTentativa] = useState(0);
    const [busca, setBusca] = useState("");

    useEffect(() => {
        let cancelado = false;

        buscarCardapio()
            .then((cardapio) => {
                if (!cancelado) {
                    setEstado({ tipo: "pronto", cardapio });
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
    }, [tentativa]);

    const termo = normalizar(busca.trim());

    const filtrado = useMemo(() => {
        if (estado.tipo !== "pronto") {
            return null;
        }

        const { promocoes, combos, produtos } = estado.cardapio;

        if (!termo) {
            return estado.cardapio;
        }

        return {
            promocoes: promocoes.filter((i) => combina(termo, i.nome, i.descricao)),
            combos: combos.filter((i) => combina(termo, i.nome, i.descricao)),
            produtos: produtos.filter((i) => combina(termo, i.nome, i.descricao)),
        };
    }, [estado, termo]);

    const secoes = filtrado
        ? [
              { id: "promocoes", titulo: "Promoções", total: filtrado.promocoes.length },
              { id: "combos", titulo: "Combos", total: filtrado.combos.length },
              { id: "cardapio", titulo: "Cardápio", total: filtrado.produtos.length },
          ].filter((s) => s.total > 0)
        : [];

    const nada = filtrado !== null && secoes.length === 0;
    const primeiroNome = me?.name?.trim().split(" ")[0];

    const tentarDeNovo = () => {
        setEstado({ tipo: "carregando" });
        setTentativa((t) => t + 1);
    };

    return (
        // Ocupa a largura toda (o <main> tem padding) para os carrosséis irem até a borda.
        // A altura mínima desconta o header (80px) e o padding de baixo do <main>, para o fundo ir até o fim.
        <div className="-mx-2 -mb-2 -mt-2 min-h-[calc(100dvh-5rem)] bg-neutral-50 pb-10 text-neutral-900 sm:-mx-4 sm:-mb-4 sm:-mt-4">
            <div className="w-full">
                <div className={`${PX} pb-1 pt-5 md:pt-8`}>
                    <p className="text-sm text-neutral-500">
                        {primeiroNome ? `Olá, ${primeiroNome}!` : "Bem-vindo à Marusan!"}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        O que vai pedir hoje?
                    </h1>
                </div>

                {/* Busca fixa logo abaixo do header (que tem 80px). */}
                <div className={`sticky top-20 z-10 bg-neutral-50/95 ${PX} pb-3 pt-3 backdrop-blur md:flex md:items-center md:gap-4 md:py-4`}>
                    <label className="flex h-12 items-center gap-2 rounded-full bg-white px-4 shadow-sm ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-(--primary) md:min-w-0 md:max-w-md md:flex-1">
                        <Search className="text-neutral-400" fontSize="small" />

                        <input
                            type="search"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar no cardápio"
                            aria-label="Buscar no cardápio"
                            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400 [&::-webkit-search-cancel-button]:hidden"
                        />

                        {busca && (
                            <button
                                type="button"
                                onClick={() => setBusca("")}
                                aria-label="Limpar busca"
                                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 active:bg-neutral-100"
                            >
                                <Close fontSize="small" />
                            </button>
                        )}
                    </label>

                    {secoes.length > 1 && (
                        <nav aria-label="Seções do cardápio" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:mt-0 md:shrink-0 md:overflow-visible md:px-0">
                            {secoes.map((secao) => (
                                <a
                                    key={secao.id}
                                    href={`#${secao.id}`}
                                    className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 ring-1 ring-black/10 active:bg-red-50 active:text-(--primary)"
                                >
                                    {secao.titulo}
                                </a>
                            ))}
                        </nav>
                    )}
                </div>

                {estado.tipo === "carregando" && <Carregando />}

                {estado.tipo === "erro" && (
                    <Aviso
                        titulo="Não foi possível carregar o cardápio"
                        texto={estado.mensagem}
                        acao={{ label: "Tentar de novo", onClick: tentarDeNovo }}
                    />
                )}

                {nada && termo && (
                    <Aviso
                        titulo="Nada encontrado"
                        texto={`Nenhum item com "${busca.trim()}". Tente outro nome.`}
                        acao={{ label: "Limpar busca", onClick: () => setBusca("") }}
                    />
                )}

                {nada && !termo && (
                    <Aviso
                        titulo="Cardápio vazio por enquanto"
                        texto="Ainda não há itens disponíveis. Volte mais tarde!"
                    />
                )}

                {filtrado && (
                    <div className="flex flex-col gap-7 pt-2 md:gap-10 md:pt-4">
                        {filtrado.promocoes.length > 0 && (
                            <Secao id="promocoes" titulo="Promoções" subtitulo="Por tempo limitado">
                                <Carrossel>
                                    {filtrado.promocoes.map((item) => (
                                        <CardPromocao key={item.id} item={item} />
                                    ))}
                                </Carrossel>
                            </Secao>
                        )}

                        {filtrado.combos.length > 0 && (
                            <Secao id="combos" titulo="Combos" subtitulo="Mais itens por menos">
                                <Carrossel>
                                    {filtrado.combos.map((item) => (
                                        <CardCombo key={item.id} item={item} />
                                    ))}
                                </Carrossel>
                            </Secao>
                        )}

                        {filtrado.produtos.length > 0 && (
                            <Secao id="cardapio" titulo="Cardápio">
                                <ul className={`${MX} divide-y divide-neutral-200 rounded-2xl bg-white px-4 ring-1 ring-black/5 md:divide-y-0 md:bg-transparent md:px-0 md:ring-0 ${GRADE}`}>
                                    {filtrado.produtos.map((item) => (
                                        <li key={item.id}>
                                            <LinhaProduto item={item} />
                                        </li>
                                    ))}
                                </ul>
                            </Secao>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Secao({
    id,
    titulo,
    subtitulo,
    children,
}: {
    id: string;
    titulo: string;
    subtitulo?: string;
    children: React.ReactNode;
}) {
    return (
        // scroll-mt: ao pular pelo atalho, o título não fica escondido atrás do header + busca.
        // 208px = header (80) + busca e atalhos fixos (~116) + folga.
        <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-52">
            <div className={`mb-3 ${PX} md:mb-4`}>
                <h2 id={`${id}-titulo`} className="text-lg font-bold md:text-xl">
                    {titulo}
                </h2>
                {subtitulo && <p className="text-xs text-neutral-500">{subtitulo}</p>}
            </div>

            {children}
        </section>
    );
}

function Carrossel({ children }: { children: React.ReactNode }) {
    return (
        <div className={`flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 ${PX} pb-2 [scrollbar-width:none] md:pb-0 ${GRADE}`}>
            {children}
        </div>
    );
}

function Carregando() {
    return (
        <div className="flex flex-col gap-7 pt-2 md:gap-10 md:pt-4" aria-busy="true" aria-label="Carregando cardápio">
            {[0, 1].map((secao) => (
                <div key={secao}>
                    <div className={`${MX} mb-3 h-5 w-32 animate-pulse rounded bg-neutral-200`} />
                    <div className={`flex gap-3 overflow-hidden ${PX} ${GRADE}`}>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <CardEsqueleto key={i} />
                        ))}
                    </div>
                </div>
            ))}

            <div className={`${MX} rounded-2xl bg-white px-4 ring-1 ring-black/5 md:hidden`}>
                <LinhaEsqueleto />
                <LinhaEsqueleto />
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
        <div className={`${MX} mt-6 flex flex-col items-center gap-2 rounded-2xl bg-white px-6 py-10 text-center ring-1 ring-black/5 md:mx-auto md:max-w-lg`}>
            <h2 className="font-semibold">{titulo}</h2>
            <p className="text-sm text-neutral-500">{texto}</p>

            {acao && (
                <button
                    type="button"
                    onClick={acao.onClick}
                    className="mt-3 rounded-full bg-(--primary) px-5 py-2 text-sm font-semibold text-white active:bg-[#C92325]"
                >
                    {acao.label}
                </button>
            )}
        </div>
    );
}
