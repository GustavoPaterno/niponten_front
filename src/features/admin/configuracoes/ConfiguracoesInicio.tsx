"use client";

import Link from "next/link";
import {
    BadgeOutlined,
    Inventory2Outlined,
    LocalOfferOutlined,
    PeopleOutlined,
    SetMealOutlined,
} from "@mui/icons-material";
import type { SvgIconComponent } from "@mui/icons-material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { modulosVisiveis } from "@/src/lib/navegacao";

const PREFIXO = "/admin/configuracoes/";

// O que cada tela de configuração resolve, em palavras de quem toca a loja.
const DETALHES: Record<string, { texto: string; Icone: SvgIconComponent }> = {
    "/admin/configuracoes/produtos": { texto: "Cardápio, preços e tamanhos", Icone: SetMealOutlined },
    "/admin/configuracoes/ingredientes": { texto: "Recheios e adicionais", Icone: Inventory2Outlined },
    "/admin/configuracoes/combos": { texto: "Combos e preços promocionais", Icone: LocalOfferOutlined },
    "/admin/configuracoes/usuarios": { texto: "Contas da equipe", Icone: PeopleOutlined },
    "/admin/configuracoes/permissoes": { texto: "O que cada cargo pode fazer", Icone: BadgeOutlined },
};

/** Início das configurações: atalhos para as telas que a pessoa pode abrir. */
export default function ConfiguracoesInicio() {
    const { me } = useSessao();

    const itens = modulosVisiveis(me)
        .flatMap((modulo) => modulo.itens)
        .filter((item) => item.href.startsWith(PREFIXO));

    return (
        <div className="px-2 pb-10 pt-4 text-tinta md:px-4 md:pt-6">
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Configurações</h1>
            <p className="mt-1 text-sm text-tinta-suave">Escolha o que quer ajustar na loja.</p>

            {itens.length === 0 ? (
                <p className="mt-8 rounded-2xl bg-white px-6 py-10 text-center text-sm text-tinta-suave">
                    Seu cargo ainda não tem acesso a nenhuma configuração. Peça a um administrador.
                </p>
            ) : (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {itens.map((item) => {
                        const detalhe = DETALHES[item.href];
                        const Icone = detalhe?.Icone ?? SetMealOutlined;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className="flex h-full items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5 transition-colors hover:ring-marca focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marca"
                                >
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marca/10 text-marca">
                                        <Icone />
                                    </span>
                                    <span className="flex flex-col">
                                        <span className="font-display text-lg font-bold">{item.label}</span>
                                        {detalhe && <span className="text-sm text-tinta-suave">{detalhe.texto}</span>}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
