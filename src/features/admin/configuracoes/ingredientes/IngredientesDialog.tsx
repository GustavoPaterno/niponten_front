"use client";

import { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    TextField,
    useMediaQuery,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import Button, {
    ButtonColor,
} from "@/src/components/button/Button";
import { parsePreco } from "@/src/lib/format";
import type {
    Ingrediente,
    IngredienteInput,
    IngredienteStatus,
} from "@/src/services/ingredientes";

interface IngredientesDialogProps {
    open: boolean;
    /** Ingrediente sendo editado. `null` = criando um novo. */
    ingrediente: Ingrediente | null;
    onClose: () => void;
    /** Devolve true quando salvou (o dialog é fechado por quem chama). */
    onSave: (input: IngredienteInput) => Promise<boolean>;
}

export default function IngredientesDialog({
    open,
    ingrediente,
    onClose,
    onSave,
}: IngredientesDialogProps) {
    const fullScreen = useMediaQuery("(max-width:639px)");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            fullScreen={fullScreen}
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: fullScreen ? 0 : "12px",
                        overflow: "hidden",
                    },
                },
            }}
        >
            {/* O formulário só existe enquanto o dialog está aberto: o estado reinicia a cada abertura. */}
            <IngredientesForm
                ingrediente={ingrediente}
                onClose={onClose}
                onSave={onSave}
            />
        </Dialog>
    );
}

interface IngredientesFormProps {
    ingrediente: Ingrediente | null;
    onClose: () => void;
    onSave: (input: IngredienteInput) => Promise<boolean>;
}

function IngredientesForm({
    ingrediente,
    onClose,
    onSave,
}: IngredientesFormProps) {
    const editando = ingrediente !== null;

    const [nome, setNome] = useState(ingrediente?.name ?? "");
    const [descricao, setDescricao] = useState(ingrediente?.description ?? "");
    const [preco, setPreco] = useState(
        ingrediente ? String(ingrediente.price) : ""
    );
    const [status, setStatus] = useState<IngredienteStatus>(
        ingrediente?.status ?? "ACTIVE"
    );
    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const precoNumero = parsePreco(preco);
    const nomeInvalido = nome.trim() === "";
    const precoInvalido =
        preco.trim() === "" || Number.isNaN(precoNumero) || precoNumero < 0;

    const handleSalvar = async () => {
        setTentouSalvar(true);

        if (nomeInvalido || precoInvalido) {
            return;
        }

        setSalvando(true);

        const salvou = await onSave({
            name: nome,
            description: descricao,
            price: precoNumero,
            status,
        });

        if (!salvou) {
            setSalvando(false);
        }
    };

    return (
        <>
            {/* Header */}
            <DialogTitle
                sx={{
                    px: { xs: 2, sm: 4 },
                    pt: 3,
                    pb: 2,
                    borderBottom: "1px solid #eeeeee",
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-[#1f2937] sm:text-2xl">
                            {editando ? "Editar Ingrediente" : "Criar Ingrediente"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {editando
                                ? "Altere as informações do ingrediente."
                                : "Preencha as informações abaixo para cadastrar um novo ingrediente."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={salvando}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
                <div className="flex flex-col gap-6 pt-5">
                    <TextField
                        label="Nome do Ingrediente"
                        placeholder="Ex: Queijo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        fullWidth
                        required
                        error={tentouSalvar && nomeInvalido}
                        helperText={
                            tentouSalvar && nomeInvalido
                                ? "Informe o nome do ingrediente."
                                : undefined
                        }
                    />

                    <TextField
                        label="Descrição"
                        placeholder="Ex: Queijo mussarela fatiado"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                    />

                    <TextField
                        label="Preço (adicional de produtos)"
                        type="number"
                        placeholder="0,00"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        fullWidth
                        required
                        error={tentouSalvar && precoInvalido}
                        helperText={
                            tentouSalvar && precoInvalido
                                ? "Informe um preço igual ou maior que zero."
                                : undefined
                        }
                        slotProps={{
                            htmlInput: {
                                min: 0,
                                step: "0.01",
                            },
                            input: {
                                startAdornment: (
                                    <span className="mr-2 text-sm text-gray-500">
                                        R$
                                    </span>
                                ),
                            },
                        }}
                    />

                    <TextField
                        select
                        label="Disponibilidade"
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as IngredienteStatus)
                        }
                        fullWidth
                    >
                        <MenuItem value="ACTIVE">Disponível</MenuItem>
                        <MenuItem value="OUT_OF_STOCK">Esgotado</MenuItem>
                    </TextField>
                </div>
            </DialogContent>

            {/* Footer */}
            <DialogActions
                sx={{
                    px: { xs: 2, sm: 4 },
                    py: 2.5,
                    borderTop: "1px solid #eeeeee",
                    gap: 1.5,
                }}
            >
                <Button
                    text="Cancelar"
                    onClick={salvando ? () => undefined : onClose}
                    color={ButtonColor.Secondary}
                />

                <Button
                    text={
                        salvando
                            ? "Salvando..."
                            : editando
                              ? "Salvar alterações"
                              : "Criar Ingrediente"
                    }
                    color={ButtonColor.Green}
                    onClick={salvando ? () => undefined : handleSalvar}
                />
            </DialogActions>
        </>
    );
}
