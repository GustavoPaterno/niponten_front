"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

// Largura do conteúdo: acompanha o header, centralizada nas telas grandes.
const CONTEUDO = "mx-auto w-full max-w-6xl px-4 md:px-6";
// No celular: carrossel horizontal. A partir de md: grade.
const GRADE = "md:grid md:grid-cols-3 md:gap-4 md:overflow-visible lg:grid-cols-4";

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

/** Vitrine da loja: é a home do app. Dá para montar o pedido inteiro sem ter conta. */
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
        // Ocupa a largura toda (o <main> tem padding) para a faixa e os carrosséis irem até a borda.
        <div className="-mx-2 -mt-2 min-h-[calc(100dvh-4rem)] pb-12 text-tinta sm:-mx-4 sm:-mt-4">
            <FaixaDaLoja saudacao={primeiroNome ? `Olá, ${primeiroNome}! O que vai ser hoje?` : null} />

            {/* Busca e atalhos ficam presos logo abaixo do header (64px). */}
            <div className="sticky top-16 z-20 border-b border-black/5 bg-chapa/95 backdrop-blur">
                <div className={`${CONTEUDO} flex flex-col gap-3 py-3 md:flex-row md:items-center md:gap-4`}>
                    <label className="flex h-12 items-center gap-2 rounded-xl bg-white px-4 ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-marca md:max-w-md md:flex-1">
                        <Search className="text-tinta-suave" fontSize="small" />

                        <input
                            type="search"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar pastel, pizza, lanche..."
                            aria-label="Buscar no cardápio"
                            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-tinta-suave/70 [&::-webkit-search-cancel-button]:hidden"
                        />

                        {busca && (
                            <button
                                type="button"
                                onClick={() => setBusca("")}
                                aria-label="Limpar busca"
                                className="flex h-7 w-7 items-center justify-center rounded-full text-tinta-suave hover:bg-chapa"
                            >
                                <Close fontSize="small" />
                            </button>
                        )}
                    </label>

                    {secoes.length > 1 && (
                        <nav
                            aria-label="Seções do cardápio"
                            className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0"
                        >
                            {secoes.map((secao) => (
                                <a
                                    key={secao.id}
                                    href={`#${secao.id}`}
                                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 font-display text-sm font-bold ring-1 ring-black/10 hover:bg-tinta hover:text-white hover:ring-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                                >
                                    {secao.titulo}
                                    <span className="text-xs font-semibold text-tinta-suave">{secao.total}</span>
                                </a>
                            ))}
                        </nav>
                    )}
                </div>
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
                    titulo="Nada com esse nome"
                    texto={`Nenhum item com "${busca.trim()}". Tente outro nome.`}
                    acao={{ label: "Limpar busca", onClick: () => setBusca("") }}
                />
            )}

            {nada && !termo && (
                <Aviso
                    titulo="Cardápio vazio por enquanto"
                    texto="Ainda não há itens à venda. Volte mais tarde."
                />
            )}

            {filtrado && (
                <div className="flex flex-col gap-8 pt-6 md:gap-12 md:pt-8">
                    {filtrado.promocoes.length > 0 && (
                        <Secao id="promocoes" titulo="Promoções" subtitulo="Preço baixo por tempo limitado">
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
                            <ul className={`${CONTEUDO} grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3`}>
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
    );
}

/**
 * Faixa vermelha com a identidade da casa, emendada no header. Os dados vêm do perfil público
 * da Marusan (Instagram e iFood).
 */
function FaixaDaLoja({ saudacao }: { saudacao: string | null }) {
    return (
        <section aria-labelledby="loja-nome" className="relative overflow-hidden bg-marca text-white">
            <div aria-hidden="true" className="loja-sol" />

            <div className={`${CONTEUDO} relative flex items-start gap-4 pb-7 pt-5 md:items-center md:gap-6 md:pb-10 md:pt-8`}>
                <Image
                    src="/images/marusan-logo.jpg"
                    alt="Logo Marusan"
                    width={112}
                    height={112}
                    priority
                    className="h-20 w-20 shrink-0 rounded-full bg-white ring-4 ring-white md:h-28 md:w-28"
                />

                <div className="min-w-0">
                    {saudacao && <p className="mb-1 text-sm font-medium text-white/85">{saudacao}</p>}

                    <h1
                        id="loja-nome"
                        className="font-display text-[clamp(1.875rem,7vw,3.25rem)] font-extrabold leading-[0.95] tracking-tight"
                    >
                        Marusan Pastelaria
                    </h1>

                    <p className="mt-2 max-w-xl text-sm leading-snug text-white/90 md:text-base">
                        Mini pastéis, pizzas, chapeado e cachorro quente.
                    </p>

                    <ul className="mt-3 flex flex-wrap gap-2 text-xs font-bold md:text-sm">
                        <li className="rounded-full bg-tinta/25 px-3 py-1">Ilha da Figueira, Jaraguá do Sul</li>
                        <li className="rounded-full bg-mostarda px-3 py-1 text-tinta">Terça a domingo</li>
                    </ul>
                </div>
            </div>
        </section>
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
        // scroll-mt: ao pular pelo atalho, o título não fica atrás do header + busca (~64 + 130px).
        <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-52 md:scroll-mt-36">
            <div className={`${CONTEUDO} mb-3 md:mb-4`}>
                <h2 id={`${id}-titulo`} className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                    {titulo}
                </h2>
                {subtitulo && <p className="text-sm text-tinta-suave">{subtitulo}</p>}
            </div>

            {children}
        </section>
    );
}

function Carrossel({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${CONTEUDO} flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 pb-2 [scrollbar-width:none] md:pb-0 ${GRADE}`}>
            {children}
        </div>
    );
}

function Carregando() {
    return (
        <div className="flex flex-col gap-8 pt-6 md:pt-8" aria-busy="true" aria-label="Carregando cardápio">
            <div>
                <div className={`${CONTEUDO} mb-3`}>
                    <div className="h-7 w-40 animate-pulse rounded-lg bg-black/10" />
                </div>
                <div className={`${CONTEUDO} flex gap-3 overflow-hidden ${GRADE}`}>
                    {[0, 1, 2, 3].map((i) => (
                        <CardEsqueleto key={i} />
                    ))}
                </div>
            </div>

            <div className={`${CONTEUDO} grid gap-3 md:grid-cols-2 lg:grid-cols-3`}>
                {[0, 1, 2].map((i) => (
                    <LinhaEsqueleto key={i} />
                ))}
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
        <div className={`${CONTEUDO} mt-8`}>
            <div className="mx-auto flex max-w-lg flex-col items-center gap-2 rounded-2xl bg-white px-6 py-10 text-center">
                <h2 className="font-display text-xl font-extrabold">{titulo}</h2>
                <p className="text-sm text-tinta-suave">{texto}</p>

                {acao && (
                    <button
                        type="button"
                        onClick={acao.onClick}
                        className="mt-3 h-11 rounded-xl bg-marca px-6 font-display font-bold text-white hover:bg-marca-escura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
                    >
                        {acao.label}
                    </button>
                )}
            </div>
        </div>
    );
}
