"use client";

import { useState } from "react";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";

import Button from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    alterarStatusCargo,
    atualizarCargo,
    criarCargo,
    type Cargo,
    type CargoInput,
} from "@/src/services/cargos";

import PermissoesDialog from "./PermissoesDialog";
import CargosTable from "./components/CargosTable";

export default function PermissoesCore() {
    const toast = useToast();

    const [reloadKey, setReloadKey] = useState(0);

    const [dialogAberto, setDialogAberto] = useState(false);
    const [editando, setEditando] = useState<Cargo | null>(null);

    const [alvoStatus, setAlvoStatus] = useState<Cargo | null>(null);
    const [executando, setExecutando] = useState(false);

    const recarregar = () => setReloadKey((atual) => atual + 1);

    const abrirCriar = () => {
        setEditando(null);
        setDialogAberto(true);
    };

    const abrirEditar = (cargo: Cargo) => {
        setEditando(cargo);
        setDialogAberto(true);
    };

    const handleSalvar = async (input: CargoInput): Promise<boolean> => {
        try {
            if (editando) {
                await atualizarCargo(editando, input);
                toast.success("Cargo atualizado.");
            } else {
                await criarCargo(input);
                toast.success("Cargo criado.");
            }

            setDialogAberto(false);
            recarregar();

            return true;
        } catch (erro) {
            toast.error(mensagemDeErro(erro));

            return false;
        }
    };

    const confirmarStatus = async () => {
        if (!alvoStatus) {
            return;
        }

        setExecutando(true);

        try {
            const ativar = !alvoStatus.active;

            await alterarStatusCargo(alvoStatus, ativar);
            toast.success(ativar ? "Cargo ativado." : "Cargo desativado.");
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
        } finally {
            setExecutando(false);
            setAlvoStatus(null);
            recarregar();
        }
    };

    const desativando = alvoStatus?.active ?? false;

    return (
        <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-black">
                    <Typography variant="h5">Cargos e permissões</Typography>

                    <Typography variant="subtitle2" className="opacity-60">
                        Defina o que cada cargo pode gerenciar no painel
                    </Typography>
                </div>

                <div className="text-black sm:shrink-0">
                    <Button text="Novo cargo" icon={Add} onClick={abrirCriar} />
                </div>
            </div>

            <div className="mb-2">
                <CargosTable
                    reloadKey={reloadKey}
                    onEditar={abrirEditar}
                    onAlterarStatus={setAlvoStatus}
                />
            </div>

            <PermissoesDialog
                open={dialogAberto}
                cargo={editando}
                onClose={() => setDialogAberto(false)}
                onSave={handleSalvar}
            />

            <ConfirmDialog
                open={alvoStatus !== null}
                title={desativando ? "Desativar cargo" : "Ativar cargo"}
                confirmText={desativando ? "Desativar" : "Ativar"}
                danger={desativando}
                loading={executando}
                onConfirm={confirmarStatus}
                onCancel={() => setAlvoStatus(null)}
            >
                {alvoStatus && (
                    <p>
                        {desativando ? "Desativar" : "Ativar"} o cargo{" "}
                        <strong>{alvoStatus.label}</strong>?{" "}
                        {desativando
                            ? "Ele deixa de aparecer como opção para novos usuários."
                            : "Ele volta a aparecer como opção para os usuários."}
                    </p>
                )}
            </ConfirmDialog>
        </div>
    );
}
