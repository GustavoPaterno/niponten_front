"use client";

import { useEffect, useState } from "react";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";

import Button from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    atualizarCategoria,
    criarCategoria,
    excluirCategoria,
    listarCategorias,
    type CategoriaComProdutos,
    type CategoriaInput,
} from "@/src/services/categorias";

import CategoriasDialog from "./CategoriasDialog";
import CategoriasTable from "./components/CategoriasTable";

// Espaço entre as ordens sugeridas: dá para encaixar uma categoria entre duas sem renumerar.
const PASSO_ORDEM = 10;

/** Gestão das categorias do cardápio (/admin/configuracoes/categorias). */
export default function CategoriasCore() {
    const toast = useToast();
    const [reloadKey, setReloadKey] = useState(0);
    const [dialogAberto, setDialogAberto] = useState(false);
    const [editando, setEditando] = useState<CategoriaComProdutos | null>(null);
    const [excluindo, setExcluindo] = useState<CategoriaComProdutos | null>(null);
    const [executando, setExecutando] = useState(false);
    const [proximaOrdem, setProximaOrdem] = useState(PASSO_ORDEM);

    const recarregar = () => setReloadKey((atual) => atual + 1);

    // A ordem sugerida para a próxima categoria acompanha a lista.
    useEffect(() => {
        listarCategorias()
            .then((lista) =>
                setProximaOrdem(lista.length === 0 ? PASSO_ORDEM : Math.max(...lista.map((c) => c.ordem)) + PASSO_ORDEM)
            )
            .catch(() => {});
    }, [reloadKey]);

    const handleSalvar = async (input: CategoriaInput): Promise<boolean> => {
        try {
            if (editando) {
                await atualizarCategoria(editando.id, input);
                toast.success("Categoria atualizada.");
            } else {
                await criarCategoria(input);
                toast.success("Categoria criada.");
            }

            setDialogAberto(false);
            recarregar();

            return true;
        } catch (erro) {
            toast.error(
                erro instanceof Error && /already exists/i.test(erro.message)
                    ? "Já existe uma categoria com esse nome."
                    : mensagemDeErro(erro)
            );

            return false;
        }
    };

    const confirmarExclusao = async () => {
        if (!excluindo) {
            return;
        }

        setExecutando(true);

        try {
            await excluirCategoria(excluindo.id);
            toast.success("Categoria excluída.");
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        } finally {
            setExecutando(false);
            setExcluindo(null);
            recarregar();
        }
    };

    const temProdutos = (excluindo?.produtos ?? 0) > 0;

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-tinta">
                    <Typography variant="h5">Categorias</Typography>
                    <Typography variant="subtitle2" className="opacity-60">
                        Seções do cardápio, como Pastéis, Sucos e Pizzas
                    </Typography>
                </div>

                <div className="text-tinta sm:shrink-0">
                    <Button
                        text="Nova categoria"
                        icon={Add}
                        onClick={() => {
                            setEditando(null);
                            setDialogAberto(true);
                        }}
                    />
                </div>
            </div>

            <div className="mb-2">
                <CategoriasTable
                    reloadKey={reloadKey}
                    onEditar={(categoria) => {
                        setEditando(categoria);
                        setDialogAberto(true);
                    }}
                    onExcluir={setExcluindo}
                />
            </div>

            <CategoriasDialog
                open={dialogAberto}
                categoria={editando}
                proximaOrdem={proximaOrdem}
                onClose={() => setDialogAberto(false)}
                onSave={handleSalvar}
            />

            <ConfirmDialog
                open={excluindo !== null}
                title={temProdutos ? "Categoria em uso" : "Excluir categoria"}
                confirmText={temProdutos ? "Entendi" : "Excluir"}
                danger={!temProdutos}
                loading={executando}
                onConfirm={temProdutos ? () => setExcluindo(null) : confirmarExclusao}
                onCancel={() => setExcluindo(null)}
            >
                {temProdutos ? (
                    <p>
                        <strong>{excluindo?.name}</strong> tem{" "}
                        {excluindo?.produtos === 1 ? "1 produto" : `${excluindo?.produtos} produtos`}. Mude a categoria
                        deles na tela de Produtos antes de excluir.
                    </p>
                ) : (
                    <p>
                        Excluir a categoria <strong>{excluindo?.name}</strong>? Essa ação não pode ser desfeita.
                    </p>
                )}
            </ConfirmDialog>
        </div>
    );
}
