"use client";

import { useState } from "react";
import { Add } from "@mui/icons-material";
import { Typography } from "@mui/material";

import Button from "@/src/components/button/Button";
import ConfirmDialog from "@/src/components/dialog/ConfirmDialog";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import {
    alterarStatusUsuarioInterno,
    atualizarUsuarioInterno,
    criarUsuarioInterno,
    type NovoUsuarioInternoInput,
    type UsuarioInterno,
} from "@/src/services/usuariosInternos";

import UsuariosDialog from "./UsuariosDialog";
import UsuariosTable from "./components/UsuariosTable";

export default function UsuariosCore() {
    const toast = useToast();

    const [reloadKey, setReloadKey] = useState(0);

    const [dialogAberto, setDialogAberto] = useState(false);
    const [editando, setEditando] = useState<UsuarioInterno | null>(null);

    const [alvoStatus, setAlvoStatus] = useState<UsuarioInterno | null>(null);
    const [executando, setExecutando] = useState(false);

    const recarregar = () => setReloadKey((atual) => atual + 1);

    const abrirCriar = () => {
        setEditando(null);
        setDialogAberto(true);
    };

    const abrirEditar = (usuario: UsuarioInterno) => {
        setEditando(usuario);
        setDialogAberto(true);
    };

    const handleSalvar = async (
        input: NovoUsuarioInternoInput
    ): Promise<boolean> => {
        try {
            if (editando) {
                await atualizarUsuarioInterno(editando, input);
                toast.success("Usuário atualizado.");
            } else {
                await criarUsuarioInterno(input);
                toast.success("Usuário criado.");
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

            await alterarStatusUsuarioInterno(alvoStatus, ativar);
            toast.success(ativar ? "Usuário ativado." : "Usuário desativado.");
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
                    <Typography variant="h5">Usuários internos</Typography>

                    <Typography variant="subtitle2" className="opacity-60">
                        Gerencie os funcionários com acesso ao painel
                    </Typography>
                </div>

                <div className="text-black sm:shrink-0">
                    <Button
                        text="Novo usuário"
                        icon={Add}
                        onClick={abrirCriar}
                    />
                </div>
            </div>

            <div className="mb-2">
                <UsuariosTable
                    reloadKey={reloadKey}
                    onEditar={abrirEditar}
                    onAlterarStatus={setAlvoStatus}
                />
            </div>

            <UsuariosDialog
                open={dialogAberto}
                usuario={editando}
                onClose={() => setDialogAberto(false)}
                onSave={handleSalvar}
            />

            <ConfirmDialog
                open={alvoStatus !== null}
                title={desativando ? "Desativar usuário" : "Ativar usuário"}
                confirmText={desativando ? "Desativar" : "Ativar"}
                danger={desativando}
                loading={executando}
                onConfirm={confirmarStatus}
                onCancel={() => setAlvoStatus(null)}
            >
                {alvoStatus && (
                    <p>
                        {desativando ? "Desativar" : "Ativar"}{" "}
                        <strong>
                            {alvoStatus.nomeCompleto || alvoStatus.email}
                        </strong>
                        ?{" "}
                        {desativando
                            ? "A pessoa não vai conseguir entrar até ser ativada de novo."
                            : "A pessoa volta a conseguir entrar no sistema."}
                    </p>
                )}
            </ConfirmDialog>
        </div>
    );
}
