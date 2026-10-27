"use client";

import { useState } from "react";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";

import Button from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    alterarStatusCombo,
    atualizarCombo,
    criarCombo,
    excluirCombo,
    type Combo,
    type ComboInput,
} from "@/src/services/combos";

import CombosDialog from "./CombosDialog";
import CombosTable from "./components/CombosTable";

type Acao =
    | { tipo: "status"; combo: Combo }
    | { tipo: "excluir"; combo: Combo };

export default function CombosCore() {
    const toast = useToast();

    const [reloadKey, setReloadKey] = useState(0);

    const [dialogAberto, setDialogAberto] = useState(false);
    const [editando, setEditando] = useState<Combo | null>(null);

    const [acao, setAcao] = useState<Acao | null>(null);
    const [executando, setExecutando] = useState(false);

    const recarregar = () => setReloadKey((atual) => atual + 1);

    const abrirCriar = () => {
        setEditando(null);
        setDialogAberto(true);
    };

    const abrirEditar = (combo: Combo) => {
        setEditando(combo);
        setDialogAberto(true);
    };

    const handleSalvar = async (input: ComboInput): Promise<boolean> => {
        try {
            if (editando) {
                await atualizarCombo(editando, input);
                toast.success("Combo atualizado.");
            } else {
                await criarCombo(input);
                toast.success("Combo criado.");
            }

            setDialogAberto(false);
            recarregar();

            return true;
        } catch (erro) {
            if (editando) {
                toast.error(
                    `${mensagemDeErro(erro)} Algumas alterações podem ter sido aplicadas: confira o combo na lista.`
                );
                setDialogAberto(false);
                recarregar();

                return true;
            }

            toast.error(mensagemDeErro(erro));

            return false;
        }
    };

    const cancelarAcao = () => setAcao(null);

    const confirmarAcao = async () => {
        if (!acao) {
            return;
        }

        setExecutando(true);

        try {
            if (acao.tipo === "status") {
                const novoStatus =
                    acao.combo.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

                await alterarStatusCombo(acao.combo, novoStatus);

                toast.success(
                    novoStatus === "INACTIVE" ? "Combo inativado." : "Combo ativado."
                );
            } else {
                await excluirCombo(acao.combo.id);
                toast.success("Combo excluído.");
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

    const inativando =
        acao?.tipo === "status" && acao.combo.status === "ACTIVE";

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-black">
                    <Typography variant="h5">Combos</Typography>

                    <Typography variant="subtitle2" className="opacity-60">
                        Gerencie os combos da loja
                    </Typography>
                </div>

                <div className="text-black sm:shrink-0">
                    <Button text="Novo combo" icon={Add} onClick={abrirCriar} />
                </div>
            </div>

            <div className="mb-2">
                <CombosTable
                    reloadKey={reloadKey}
                    onEditar={abrirEditar}
                    onAlterarStatus={(combo) => setAcao({ tipo: "status", combo })}
                    onExcluir={(combo) => setAcao({ tipo: "excluir", combo })}
                />
            </div>

            <CombosDialog
                open={dialogAberto}
                combo={editando}
                onClose={() => setDialogAberto(false)}
                onSave={handleSalvar}
            />

            <ConfirmDialog
                open={acao !== null}
                title={
                    acao?.tipo === "excluir"
                        ? "Excluir combo"
                        : inativando
                          ? "Inativar combo"
                          : "Ativar combo"
                }
                confirmText={acao?.tipo === "excluir" ? "Excluir" : "Confirmar"}
                danger={acao?.tipo === "excluir"}
                loading={executando}
                onConfirm={confirmarAcao}
                onCancel={cancelarAcao}
            >
                {acao?.tipo === "excluir" && (
                    <p>
                        Excluir o combo <strong>{acao.combo.name}</strong>? Essa
                        ação não pode ser desfeita.
                    </p>
                )}

                {acao?.tipo === "status" && (
                    <p>
                        {inativando ? "Inativar" : "Ativar"}{" "}
                        <strong>{acao.combo.name}</strong>?
                    </p>
                )}
            </ConfirmDialog>
        </div>
    );
}
