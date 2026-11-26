"use client";

import { useState } from "react";
import { Tab, Tabs, Typography } from "@mui/material";

import { useSessao } from "@/src/components/auth/SessaoProvider";
import { temPermissao } from "@/src/lib/navegacao";

import ClientesPontos from "./components/ClientesPontos";
import ProgramaPontos from "./components/ProgramaPontos";

type Aba = "programa" | "clientes";

export default function PontosCore() {
    const { me } = useSessao();
    const [aba, setAba] = useState<Aba>("programa");

    // Consultar clientes exige "Usuários" no backend, além de "Pontos".
    const podeVerClientes = temPermissao(me, "MANAGE_USERS");

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="text-tinta">
                <Typography variant="h5">Pontos</Typography>

                <Typography variant="subtitle2" className="opacity-60">
                    Gerencie o programa de pontos e o saldo dos clientes
                </Typography>
            </div>

            <Tabs value={aba} onChange={(_evento, valor: Aba) => setAba(valor)}>
                <Tab value="programa" label="Programa" />
                <Tab value="clientes" label="Clientes" />
            </Tabs>

            {/* A aba do programa fica montada para não perder o que foi digitado ao trocar de aba. */}
            <div hidden={aba !== "programa"}>
                <ProgramaPontos />
            </div>

            {aba === "clientes" &&
                (podeVerClientes ? (
                    <ClientesPontos />
                ) : (
                    <p className="rounded-xl bg-white px-6 py-10 text-center text-sm text-tinta-suave shadow-component">
                        Para consultar e ajustar os pontos dos clientes, seu cargo também precisa da permissão
                        &quot;Usuários&quot;. Peça a um administrador.
                    </p>
                ))}
        </div>
    );
}
