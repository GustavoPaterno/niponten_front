"use client";

import Button from "@/src/components/button/Button";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { useState } from "react";
import IngredientesDialog from "./IngredientesDialog";
import DatatableMockedIngredientes from "./components/DataTableMockedIngredientes";

export default function IngredientesCore() {
const [open, setOpen] = useState(false);

const [nome, setNome] = useState("");
const [descricao, setDescricao] = useState("");
const [imagem, setImagem] = useState<string | null>("");
const [preco, setPreco] = useState("");
const [status, setStatus] = useState("ACTIVE");

const handleSalvar = () => {
    const ingrediente = {
        id: 0,
        name: nome,
        description: descricao,
        imageUrl: imagem,
        price: Number(preco),
        status,
    };

    console.log(ingrediente);

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
            descricao={descricao}
            imagem={imagem}
            preco={preco}
            status={status}
            setNome={setNome}
            setDescricao={setDescricao}
            setImagem={setImagem}
            setPreco={setPreco}
            setStatus={setStatus}
        />
    </div>
);

}