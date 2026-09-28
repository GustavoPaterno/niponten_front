"use client";

import { useState } from "react";
import { Add, Person } from "@mui/icons-material";
import Typography from "@mui/material/Typography";

import Button from "@/src/components/button/Button";
import InfoCard from "@/src/components/card/InfoCard";
import DatatableMocked from "@/src/components/table/DataTableMocked";
import PermissoesDialog from "./PermissoesDialog";

export default function PermissoesCore() {
    const [open, setOpen] = useState(false);

    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");

    const [permissoes, setPermissoes] = useState({
        visualizar: true,
        criar: false,
        editar: false,
        excluir: false,
        configuracoesSensiveis: false,
    });

    const handleSalvar = () => {
        const cargo = {
            nome,
            descricao,
            permissoes,
        };

        console.log("Novo cargo:", cargo);

        setOpen(false);
    };

    return (
        <div className="flex h-full flex-col gap-2 p-2 sm:gap-5 sm:p-4">

            <div className="flex h-[15%] flex-row sm:h-[10%]">

                <div className="w-[60%] text-black">
                    <Typography variant="h5">
                        Cargo/Permissão
                    </Typography>

                    <Typography
                        variant="subtitle2"
                        className="opacity-60"
                    >
                        Gerencie os funcionários da loja
                    </Typography>
                </div>

                <div className="flex w-[40%] justify-end text-black">

                    <Button
                        text="Novo cargo"
                        icon={Add}
                        onClick={() => setOpen(true)}
                    />

                </div>

            </div>

            <div className="flex h-[15%] gap-5 sm:h-[25%]">

                <InfoCard
                    size="1/2"
                    icon={Person}
                    iconColor="#EE2C2E"
                    text="11"
                    title="Total"
                />

                <InfoCard
                    size="1/2"
                    icon={Person}
                    iconColor="#FFC038"
                    text="8"
                    title="Ativo"
                />

            </div>

            <div className="mb-2 h-[70%] sm:h-[65%]">
                <DatatableMocked />
            </div>

            <PermissoesDialog
                open={open}
                onClose={() => setOpen(false)}
                onSave={handleSalvar}
                nome={nome}
                descricao={descricao}
                permissoes={permissoes}
                setNome={setNome}
                setDescricao={setDescricao}
                setPermissoes={setPermissoes}
            />

        </div>
    );
}