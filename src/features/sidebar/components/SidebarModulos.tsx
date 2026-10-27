"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { useSidebar } from "@/src/components/sidebar/SidebarProvider";
import {
    itemDaRota,
    modulosVisiveis,
    type ModuloNavegacao,
} from "@/src/lib/navegacao";

export default function SidebarModulos() {
    const pathname = usePathname();
    const { me, carregando } = useSessao();

    const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());

    const modulos = modulosVisiveis(carregando ? null : me);
    const ativo = itemDaRota(pathname)?.href;

    const alternar = (titulo: string) => {
        setRecolhidos((atual) => {
            const novo = new Set(atual);

            if (novo.has(titulo)) {
                novo.delete(titulo);
            } else {
                novo.add(titulo);
            }

            return novo;
        });
    };

    return (
        <nav aria-label="Menu principal" className="flex w-full flex-col gap-3">
            {modulos.map((modulo) => (
                <Modulo
                    key={modulo.titulo}
                    modulo={modulo}
                    aberto={!recolhidos.has(modulo.titulo)}
                    ativo={ativo}
                    onAlternar={() => alternar(modulo.titulo)}
                />
            ))}
        </nav>
    );
}

interface ModuloProps {
    modulo: ModuloNavegacao;
    aberto: boolean;
    ativo: string | undefined;
    onAlternar: () => void;
}

function Modulo({ modulo, aberto, ativo, onAlternar }: ModuloProps) {
    const { closeSidebar } = useSidebar();
    const idLista = `modulo-${modulo.titulo.normalize("NFD").replace(/\W+/g, "-").toLowerCase()}`;

    return (
        <div className="w-full">
            <button
                type="button"
                onClick={onAlternar}
                aria-expanded={aberto}
                aria-controls={idLista}
                className="flex w-full cursor-pointer items-center justify-between rounded-md py-1.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
                <span className="pl-2">{modulo.titulo}</span>

                <ExpandMoreIcon
                    fontSize="small"
                    aria-hidden
                    className={`transition-transform duration-200 ${aberto ? "rotate-0" : "-rotate-90"}`}
                />
            </button>

            <div
                id={idLista}
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                    aberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
                inert={!aberto}
            >
                <div className="min-h-0 overflow-hidden">
                    <ul className="flex flex-col gap-2 pt-1">
                        {modulo.itens.map((item) => {
                            const atual = item.href === ativo;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={closeSidebar}
                                        aria-current={atual ? "page" : undefined}
                                        className={`flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm text-black transition-colors duration-200 hover:bg-red-100 ${
                                            atual ? "bg-red-100 font-medium" : "bg-gray-100"
                                        }`}
                                    >
                                        <span>{item.label}</span>

                                        <span className="text-lg text-red-500">›</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
}
