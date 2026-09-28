"use client";

import { useState } from "react";
import { Add, Person } from "@mui/icons-material";
import Typography from "@mui/material/Typography";

import Button from "@/src/components/button/Button";
import InfoCard from "@/src/components/card/InfoCard";
import PermissoesDialog from "./PermissoesDialog";
import DatatableMockedPermissoes from "./components/DataTableMockedPermissoes";

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
        setOpen(false);
    };

    return (
        <div className="flex h-[80%] min-h-0 flex-col gap-2 overflow-hidden p-2 sm:gap-5 sm:p-4">

            <div className="flex shrink-0 flex-row">
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

            <div className="min-h-0 flex-1">
                <DatatableMockedPermissoes />
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