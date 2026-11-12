"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ExpandMore } from "@mui/icons-material";

import { formatCurrency } from "@/src/lib/format";
import type { TamanhoDetalhe } from "@/src/services/detalheItem";

interface SeletorTamanhoProps {
    tamanhos: TamanhoDetalhe[];
    selecionado: number;
    onChange: (productSizeId: number) => void;
}

function Preco({ tamanho }: { tamanho: TamanhoDetalhe }) {
    return (
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
            {tamanho.precoOriginal !== null && (
                <span className="text-xs text-tinta-suave/70 line-through">
                    {formatCurrency(tamanho.precoOriginal)}
                </span>
            )}
            <span className={`font-semibold ${tamanho.precoOriginal !== null ? "text-marca" : ""}`}>
                {formatCurrency(tamanho.preco)}
            </span>
        </span>
    );
}

/** Select de tamanho próprio (botão + lista), com preço de cada opção. Um tamanho só vira texto fixo. */
export default function SeletorTamanho({ tamanhos, selecionado, onChange }: SeletorTamanhoProps) {
    const [aberto, setAberto] = useState(false);
    const raiz = useRef<HTMLDivElement>(null);
    const opcoes = useRef<(HTMLButtonElement | null)[]>([]);
    const idLista = useId();

    const atual = tamanhos.find((t) => t.productSizeId === selecionado) ?? tamanhos[0];

    // Fecha ao clicar fora ou apertar Esc.
    useEffect(() => {
        if (!aberto) {
            return;
        }

        const fora = (e: PointerEvent) => {
            if (!raiz.current?.contains(e.target as Node)) {
                setAberto(false);
            }
        };
        const tecla = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setAberto(false);
            }
        };

        document.addEventListener("pointerdown", fora);
        document.addEventListener("keydown", tecla);

        // Ao abrir, o foco vai para a opção marcada.
        opcoes.current[tamanhos.indexOf(atual)]?.focus();

        return () => {
            document.removeEventListener("pointerdown", fora);
            document.removeEventListener("keydown", tecla);
        };
    }, [aberto, atual, tamanhos]);

    if (tamanhos.length === 1) {
        return (
            <div className="flex items-center justify-between rounded-xl bg-chapa px-4 py-3 ring-1 ring-black/5">
                <span className="font-medium">{atual.nome}</span>
                <Preco tamanho={atual} />
            </div>
        );
    }

    const mover = (indice: number, passo: number) => {
        const proximo = (indice + passo + tamanhos.length) % tamanhos.length;
        opcoes.current[proximo]?.focus();
    };

    return (
        <div ref={raiz} className="relative">
            <button
                type="button"
                onClick={() => setAberto((a) => !a)}
                aria-haspopup="listbox"
                aria-expanded={aberto}
                aria-controls={idLista}
                className={`flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-left ring-1 transition ${
                    aberto ? "ring-2 ring-marca" : "ring-black/15 hover:ring-black/30"
                }`}
            >
                <span className="font-medium">{atual.nome}</span>

                <span className="flex items-center gap-2">
                    <Preco tamanho={atual} />
                    <ExpandMore
                        fontSize="small"
                        className={`text-tinta-suave transition-transform ${aberto ? "rotate-180" : ""}`}
                    />
                </span>
            </button>

            {aberto && (
                <ul
                    id={idLista}
                    role="listbox"
                    aria-label="Tamanhos"
                    className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/10"
                >
                    {tamanhos.map((tamanho, i) => {
                        const marcado = tamanho.productSizeId === atual.productSizeId;

                        return (
                            <li key={tamanho.productSizeId}>
                                <button
                                    ref={(el) => {
                                        opcoes.current[i] = el;
                                    }}
                                    type="button"
                                    role="option"
                                    aria-selected={marcado}
                                    onClick={() => {
                                        onChange(tamanho.productSizeId);
                                        setAberto(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            mover(i, 1);
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            mover(i, -1);
                                        }
                                    }}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-chapa focus-visible:bg-marca/10 ${
                                        marcado ? "bg-marca/5" : ""
                                    }`}
                                >
                                    <span className="flex w-5 shrink-0 justify-center text-marca">
                                        {marcado && <Check fontSize="small" />}
                                    </span>
                                    <span className={`flex-1 ${marcado ? "font-semibold" : ""}`}>
                                        {tamanho.nome}
                                    </span>
                                    <Preco tamanho={tamanho} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
