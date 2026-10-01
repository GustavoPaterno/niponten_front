"use client";

import Button from "@/src/components/button/Button";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { useState } from "react";
import ProdutosDialog from "./ProdutosDialog";
import DatatableMockedProdutos from "./components/DataTableMockedProdutos";

interface Produto {
    id: number;
    name: string;
    imageUrl: string | null;
    description: string;
    status: string;
    ingredients: {
        id: number;
        productId: number;
        ingredientId: number;
    }[];
    sizes: {
        id: number;
        productId: number;
        sizeId: number;
        name: string;
        price: number;
        status: string;
    }[];
}

export default function ProdutosCore() {
    const [open, setOpen] = useState(false);

    const handleSalvar = (produto: Produto) => {
        console.log("Produto:", produto);

        setOpen(false);
    };

    const handleFechar = () => {
        setOpen(false);
    };

    return (
        <div className="flex h-full flex-col gap-2 p-2 sm:gap-5 sm:p-4">
            <div className="flex h-[15%] flex-row sm:h-[10%]">
                <div className="w-[60%] text-black">
                    <Typography variant="h5">
                        Produtos
                    </Typography>

                    <Typography
                        variant="subtitle2"
                        className="opacity-60"
                    >
                        Gerencie os produtos da loja
                    </Typography>
                </div>

                <div className="flex w-[40%] justify-end text-black">
                    <Button
                        text="Novo produto"
                        icon={Add}
                        onClick={() => setOpen(true)}
                    />
                </div>
            </div>

            <div className="mb-2 h-[70%] sm:h-[65%]">
                <DatatableMockedProdutos />
            </div>

            <ProdutosDialog
                open={open}
                onClose={handleFechar}
                onSave={handleSalvar}
            />
        </div>
    );
}