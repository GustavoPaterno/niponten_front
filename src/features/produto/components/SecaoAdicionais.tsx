"use client";

import { useId, useRef } from "react";
import { ExpandMore } from "@mui/icons-material";

import { formatCurrency } from "@/src/lib/format";
import type { AdicionalDetalhe } from "@/src/services/detalheItem";

import Contador from "./Contador";

interface SecaoAdicionaisProps {
    adicionais: AdicionalDetalhe[];
    quantidades: Record<number, number>;
    onChange: (ingredientId: number, quantidade: number) => void;
    aberto: boolean;
    onAlternar: () => void;
}

/**
 * Lista de adicionais recolhível. Aberta, o cabeçalho fica fixo logo abaixo do header enquanto
 * a pessoa rola a lista, para dar para recolher de qualquer ponto.
 */
export default function SecaoAdicionais({
    adicionais,
    quantidades,
    onChange,
    aberto,
    onAlternar,
}: SecaoAdicionaisProps) {
    const secao = useRef<HTMLElement>(null);
    const idLista = useId();

    const escolhidos = adicionais.filter((a) => (quantidades[a.ingredientId] ?? 0) > 0);
    const totalUnidades = escolhidos.reduce((t, a) => t + quantidades[a.ingredientId], 0);
    const totalPreco = escolhidos.reduce((t, a) => t + a.preco * quantidades[a.ingredientId], 0);

    const alternar = () => {
        // Ao recolher depois de rolar a lista, volta para o começo da seção.
        if (aberto && secao.current && secao.current.getBoundingClientRect().top < 80) {
            secao.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        onAlternar();
    };

    return (
        <section ref={secao} className="scroll-mt-24">
            <button
                type="button"
                onClick={alternar}
                aria-expanded={aberto}
                aria-controls={idLista}
                className={`flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3.5 text-left ring-1 ring-black/10 transition md:px-6 ${
                    aberto ? "sticky top-16 z-20 rounded-b-none shadow-md" : "hover:ring-black/20"
                }`}
            >
                <span className="flex flex-col">
                    <span className="font-display text-lg font-bold">Adicionais</span>
                    <span className="text-xs text-tinta-suave">
                        {totalUnidades > 0
                            ? `${totalUnidades} ${totalUnidades === 1 ? "escolhido" : "escolhidos"}, + ${formatCurrency(totalPreco)}`
                            : "Turbine o seu pedido"}
                    </span>
                </span>

                <span className="flex items-center gap-1 text-sm font-medium text-tinta-suave">
                    {aberto ? "Recolher" : "Ver"}
                    <ExpandMore className={`transition-transform ${aberto ? "rotate-180" : ""}`} />
                </span>
            </button>

            {aberto && (
                // Um adicional por linha, ocupando a largura toda, em qualquer tela.
                <ul
                    id={idLista}
                    className="divide-y divide-black/5 rounded-b-xl bg-white px-4 ring-1 ring-black/10 md:px-6"
                >
                    {adicionais.length === 0 && (
                        <li className="py-4 text-sm text-tinta-suave">
                            Nenhum adicional disponível no momento.
                        </li>
                    )}

                    {adicionais.map((adicional) => (
                        <li
                            key={adicional.ingredientId}
                            className="flex items-center gap-3 py-2.5 md:py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className={`truncate ${adicional.esgotado ? "text-tinta-suave/70" : ""}`}>
                                    {adicional.nome}
                                </p>
                                <p className="text-xs text-tinta-suave">
                                    {adicional.esgotado ? "Esgotado" : `+ ${formatCurrency(adicional.preco)}`}
                                </p>
                            </div>

                            <Contador
                                valor={quantidades[adicional.ingredientId] ?? 0}
                                max={adicional.maximo}
                                onChange={(q) => onChange(adicional.ingredientId, q)}
                                rotulo={adicional.nome}
                                desabilitado={adicional.esgotado}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
