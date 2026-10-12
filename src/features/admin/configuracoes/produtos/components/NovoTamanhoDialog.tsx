"use client";

import { useState } from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import LimitedTextField from "@/src/components/input/LimitedTextField";

import Button, { ButtonColor } from "@/src/components/button/Button";
import { useToast } from "@/src/components/feedback/ToastProvider";
import { mensagemDeErro } from "@/src/lib/http";
import { criarTamanho, type Tamanho } from "@/src/services/tamanhos";

interface NovoTamanhoDialogProps {
    open: boolean;
    onClose: () => void;
    onCriado: (tamanho: Tamanho) => void;
}

export default function NovoTamanhoDialog({
    open,
    onClose,
    onCriado,
}: NovoTamanhoDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            {/* O formulário só existe com o dialog aberto: o campo reinicia a cada abertura. */}
            <NovoTamanhoForm onClose={onClose} onCriado={onCriado} />
        </Dialog>
    );
}

function NovoTamanhoForm({
    onClose,
    onCriado,
}: Omit<NovoTamanhoDialogProps, "open">) {
    const toast = useToast();

    const [nome, setNome] = useState("");
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const nomeInvalido = nome.trim() === "";

    const handleCriar = async () => {
        setTentouSalvar(true);

        if (nomeInvalido) {
            return;
        }

        setSalvando(true);

        try {
            const tamanho = await criarTamanho(nome);

            toast.success(`Tamanho "${tamanho.name}" criado.`);
            onCriado(tamanho);
        } catch (erro) {
            toast.error(mensagemDeErro(erro));
            setSalvando(false);
        }
    };

    return (
        <>
            <DialogTitle>Novo tamanho</DialogTitle>

            <DialogContent>
                <p className="mb-4 text-sm text-gray-500">
                    O tamanho fica disponível no catálogo e pode ser usado em
                    qualquer produto.
                </p>

                <LimitedTextField
                    autoFocus
                    label="Nome do tamanho"
                    placeholder="Ex: Médio"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !salvando) {
                            handleCriar();
                        }
                    }}
                    fullWidth
                    required
                    error={tentouSalvar && nomeInvalido}
                    helperText={
                        tentouSalvar && nomeInvalido
                            ? "Informe o nome do tamanho."
                            : undefined
                    }
                />
            </DialogContent>

            <DialogActions className="px-6 pb-5">
                <Button
                    text="Cancelar"
                    color={ButtonColor.Secondary}
                    onClick={salvando ? () => undefined : onClose}
                />

                <Button
                    text={salvando ? "Criando..." : "Criar tamanho"}
                    color={ButtonColor.Green}
                    onClick={salvando ? () => undefined : handleCriar}
                />
            </DialogActions>
        </>
    );
}
