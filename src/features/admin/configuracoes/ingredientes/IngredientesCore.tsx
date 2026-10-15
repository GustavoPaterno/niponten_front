"use client";

import { useState } from "react";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";

import Button from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import DependentesLista from "@/src/components/dialog/DependentesLista";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    alterarStatusIngrediente,
    atualizarIngrediente,
    buscarDependentesIngrediente,
    criarIngrediente,
    excluirIngrediente,
    type Ingrediente,
    type IngredienteDependentes,
    type IngredienteInput,
} from "@/src/services/ingredientes";

import IngredientesDialog from "./IngredientesDialog";
import IngredientesTable from "./components/IngredientesTable";

type Acao =
    | { tipo: "status"; ingrediente: Ingrediente }
    | { tipo: "excluir"; ingrediente: Ingrediente };

interface DependentesState {
    ingredienteId: number;
    dados: IngredienteDependentes | null;
    erro: boolean;
}

export default function IngredientesCore() {
    const toast = useToast();

    const [reloadKey, setReloadKey] = useState(0);

    const [dialogAberto, setDialogAberto] = useState(false);
    const [editando, setEditando] = useState<Ingrediente | null>(null);

    const [acao, setAcao] = useState<Acao | null>(null);
    const [executando, setExecutando] = useState(false);
    const [dependentes, setDependentes] = useState<DependentesState | null>(null);

    const recarregar = () => setReloadKey((atual) => atual + 1);

    const abrirCriar = () => {
        setEditando(null);
        setDialogAberto(true);
    };

    const abrirEditar = (ingrediente: Ingrediente) => {
        setEditando(ingrediente);
        setDialogAberto(true);
    };

    const handleSalvar = async (input: IngredienteInput): Promise<boolean> => {
        try {
            if (editando) {
                await atualizarIngrediente(editando, input);
                toast.success("Ingrediente atualizado.");
            } else {
                await criarIngrediente(input);
                toast.success("Ingrediente criado.");
            }

            setDialogAberto(false);
            recarregar();

            return true;
        } catch (erro) {
            toast.error(mensagemDeErro(erro));

            return false;
        }
    };

    const pedirAlterarStatus = (ingrediente: Ingrediente) => {
        setAcao({ tipo: "status", ingrediente });
        setDependentes(null);

        // Só vale a pena listar dependentes ao marcar como esgotado.
        if (ingrediente.status !== "ACTIVE") {
            return;
        }

        buscarDependentesIngrediente(ingrediente.id)
            .then((dados) =>
                setDependentes({ ingredienteId: ingrediente.id, dados, erro: false })
            )
            .catch(() =>
                setDependentes({ ingredienteId: ingrediente.id, dados: null, erro: true })
            );
    };

    const pedirExcluir = (ingrediente: Ingrediente) => {
        setAcao({ tipo: "excluir", ingrediente });
    };

    const cancelarAcao = () => {
        setAcao(null);
        setDependentes(null);
    };

    const confirmarAcao = async () => {
        if (!acao) {
            return;
        }

        setExecutando(true);

        try {
            if (acao.tipo === "status") {
                const novoStatus =
                    acao.ingrediente.status === "ACTIVE" ? "OUT_OF_STOCK" : "ACTIVE";

                await alterarStatusIngrediente(acao.ingrediente, novoStatus);

                toast.success(
                    novoStatus === "OUT_OF_STOCK"
                        ? "Ingrediente marcado como esgotado."
                        : "Ingrediente marcado como disponível."
                );
            } else {
                await excluirIngrediente(acao.ingrediente.id);
                toast.success("Ingrediente excluído.");
            }

            cancelarAcao();
            recarregar();
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
            cancelarAcao();
            recarregar();
        } finally {
            setExecutando(false);
        }
    };

    const marcandoEsgotado =
        acao?.tipo === "status" && acao.ingrediente.status === "ACTIVE";

    const dependentesDoAlvo =
        acao && dependentes?.ingredienteId === acao.ingrediente.id
            ? dependentes
            : null;

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-black">
                    <Typography variant="h5">Ingredientes</Typography>

                    <Typography variant="subtitle2" className="opacity-60">
                        Gerencie os ingredientes da loja
                    </Typography>
                </div>

                <div className="text-black sm:shrink-0">
                    <Button
                        text="Novo ingrediente"
                        icon={Add}
                        onClick={abrirCriar}
                    />
                </div>
            </div>

            <div className="mb-2">
                <IngredientesTable
                    reloadKey={reloadKey}
                    onEditar={abrirEditar}
                    onAlterarStatus={pedirAlterarStatus}
                    onExcluir={pedirExcluir}
                />
            </div>

            <IngredientesDialog
                open={dialogAberto}
                ingrediente={editando}
                onClose={() => setDialogAberto(false)}
                onSave={handleSalvar}
            />

            <ConfirmDialog
                open={acao !== null}
                title={
                    acao?.tipo === "excluir"
                        ? "Excluir ingrediente"
                        : marcandoEsgotado
                          ? "Marcar como esgotado"
                          : "Marcar como disponível"
                }
                confirmText={acao?.tipo === "excluir" ? "Excluir" : "Confirmar"}
                danger={acao?.tipo === "excluir"}
                loading={executando}
                onConfirm={confirmarAcao}
                onCancel={cancelarAcao}
            >
                {acao?.tipo === "excluir" && (
                    <p>
                        Excluir o ingrediente <strong>{acao.ingrediente.name}</strong>?
                        Essa ação não pode ser desfeita.
                    </p>
                )}

                {acao?.tipo === "status" && (
                    <>
                        <p>
                            Marcar <strong>{acao.ingrediente.name}</strong>{" "}
                            {marcandoEsgotado
                                ? "como esgotado?"
                                : "como disponível novamente?"}
                        </p>

                        {marcandoEsgotado && (
                            <DependentesLista
                                carregando={dependentesDoAlvo === null}
                                erro={dependentesDoAlvo?.erro ?? false}
                                grupos={[
                                    {
                                        titulo: "Produtos que usam este ingrediente",
                                        itens: dependentesDoAlvo?.dados?.produtos ?? [],
                                    },
                                    {
                                        titulo: "Produtos que o oferecem como adicional",
                                        itens:
                                            dependentesDoAlvo?.dados?.produtosAdicionais ?? [],
                                    },
                                ]}
                            />
                        )}
                    </>
                )}
            </ConfirmDialog>
        </div>
    );
}
