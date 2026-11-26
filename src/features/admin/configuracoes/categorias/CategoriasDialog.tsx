"use client";

import { useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, useMediaQuery } from "@mui/material";
import { Close } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import LimitedTextField from "@/src/components/input/LimitedTextField";
import type { Categoria, CategoriaInput } from "@/src/services/categorias";

// O backend aceita até 60 caracteres no nome.
const MAXIMO_NOME = 60;

interface CategoriasDialogProps {
    open: boolean;
    categoria: Categoria | null;
    /** Ordem sugerida para uma categoria nova: depois da última. */
    proximaOrdem: number;
    onClose: () => void;
    onSave: (input: CategoriaInput) => Promise<boolean>;
}

export default function CategoriasDialog({ open, categoria, proximaOrdem, onClose, onSave }: CategoriasDialogProps) {
    const fullScreen = useMediaQuery("(max-width:639px)");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xs"
            fullScreen={fullScreen}
            slotProps={{ paper: { sx: { borderRadius: fullScreen ? 0 : "12px", overflow: "hidden" } } }}
        >
            {/* key: abrir para outra categoria recomeça o formulário. */}
            <CategoriasForm
                key={categoria?.id ?? "nova"}
                categoria={categoria}
                proximaOrdem={proximaOrdem}
                onClose={onClose}
                onSave={onSave}
            />
        </Dialog>
    );
}

function CategoriasForm({
    categoria,
    proximaOrdem,
    onClose,
    onSave,
}: Omit<CategoriasDialogProps, "open">) {
    const editando = categoria !== null;
    const [nome, setNome] = useState(categoria?.name ?? "");
    const [ordem, setOrdem] = useState(String(categoria?.ordem ?? proximaOrdem));
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const nomeInvalido = nome.trim() === "" || nome.trim().length > MAXIMO_NOME;
    const ordemNumero = Number(ordem);
    const ordemInvalida = ordem.trim() === "" || !Number.isInteger(ordemNumero) || ordemNumero < 0;

    const handleSalvar = async () => {
        setTentouSalvar(true);

        if (nomeInvalido || ordemInvalida) {
            return;
        }

        setSalvando(true);

        if (!(await onSave({ name: nome, ordem: ordemNumero }))) {
            setSalvando(false);
        }
    };

    return (
        <>
            <DialogTitle sx={{ px: { xs: 2, sm: 4 }, pt: 3, pb: 2, borderBottom: "1px solid #eeeeee" }}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-xl font-bold text-tinta sm:text-2xl">
                            {editando ? "Editar categoria" : "Nova categoria"}
                        </h2>
                        <p className="mt-1 text-sm text-tinta-suave">
                            As categorias separam o cardápio em seções, como Pastéis, Sucos e Pizzas.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={salvando}
                        aria-label="Fechar"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-tinta-suave transition hover:bg-chapa hover:text-tinta"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
                <div className="flex flex-col gap-6 pt-5">
                    <LimitedTextField
                        label="Nome da categoria"
                        placeholder="Ex: Pastéis"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        fullWidth
                        required
                        autoFocus
                        error={tentouSalvar && nomeInvalido}
                        helperText={tentouSalvar && nomeInvalido ? "Informe o nome, com até 60 caracteres." : undefined}
                    />

                    <TextField
                        label="Ordem no cardápio"
                        type="number"
                        value={ordem}
                        onChange={(e) => setOrdem(e.target.value)}
                        fullWidth
                        required
                        error={tentouSalvar && ordemInvalida}
                        helperText={
                            tentouSalvar && ordemInvalida
                                ? "Use um número inteiro, 0 ou maior."
                                : "Menor aparece primeiro no cardápio."
                        }
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    />
                </div>
            </DialogContent>

            <DialogActions sx={{ px: { xs: 2, sm: 4 }, py: 2.5, borderTop: "1px solid #eeeeee", gap: 1.5 }}>
                <Button text="Cancelar" onClick={salvando ? () => undefined : onClose} color={ButtonColor.Secondary} />
                <Button
                    text={salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar categoria"}
                    color={ButtonColor.Green}
                    onClick={salvando ? () => undefined : handleSalvar}
                />
            </DialogActions>
        </>
    );
}
