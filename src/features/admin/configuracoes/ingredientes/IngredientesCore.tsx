"use client";

import Button from "@/src/components/button/Button";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { useState } from "react";
import IngredientesDialog from "./IngredientesDialog";
import DatatableMockedIngredientes from "./components/DataTableMockedIngredientes";

export default function IngredientesCore(){
    const [open, setOpen] = useState(false);

    const [nome, setNome] = useState("");
    const [quantidade, setQuantidade] = useState("");

    const handleSalvar = () => {
        const ingrediente = {
            nome,
            quantidade,
        };
        setOpen(false);
    };

    return (
        <div className="flex h-full flex-col gap-2 p-2 sm:gap-5 sm:p-4">

            <div className="flex h-[15%] flex-row sm:h-[10%]">

                <div className="w-[60%] text-black">
                    <Typography variant="h5">
                        Ingredientes
                    </Typography>

                    <Typography
                        variant="subtitle2"
                        className="opacity-60"
                    >
                        Gerencie os ingredientes da loja
                    </Typography>
                </div>

                <div className="flex w-[40%] justify-end text-black">

                    <Button
                        text="Novo ingrediente"
                        icon={Add}
                        onClick={() => setOpen(true)}
                    />

                </div>

            </div>

            <div className="mb-2 h-[70%] sm:h-[65%]">
                <DatatableMockedIngredientes />
            </div>

            <IngredientesDialog
                open={open}
                onClose={() => setOpen(false)}
                onSave={handleSalvar}
                nome={nome}
                quantidade={quantidade}
                setNome={setNome}
                setQuantidade={setQuantidade}
            />

        </div>
    );

}