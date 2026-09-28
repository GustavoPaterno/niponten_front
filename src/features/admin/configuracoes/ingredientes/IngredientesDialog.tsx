"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Checkbox,
    Button as MuiButton,
    Divider,
} from "@mui/material";
import { Add } from "@mui/icons-material";


import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import Button, { ButtonColor } from "@/src/components/button/Button";

interface IngredientesDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;

    nome: string;
    quantidade: string;

    setNome: (value: string) => void;
    setQuantidade: (value: string) => void;
}

export default function IngredientesDialog({
    open,
    onClose,
    onSave,
    nome,
    quantidade,
    setNome,
    setQuantidade,
}: IngredientesDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                Novo Ingrediente
            </DialogTitle>

            <DialogContent>
                <div className="flex flex-col gap-5 pt-2">
                    <div className="flex h-32 w-full items-center justify-center rounded-sm border border-[rgba(0,0,0,0.23)] cursor-pointer">
                            <Add
                                className="rounded-md"
                                sx={{
                                    color: "#000000",
                                    fontSize: 30,
                                }}
                            />
                    </div>

                    <TextField
                        label="Nome do Ingrediente"
                        placeholder="Queijo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Quantidade do ingrediente"
                        type="number"
                        placeholder="0"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        fullWidth
                        multiline
                        maxRows={1}
                    />
                </div>
            </DialogContent>

            <DialogActions className="px-20 pb-5">
                <Button
                    text="Cancelar"
                    onClick={onClose}
                    color={ButtonColor.Secondary} 
                />

                <Button
                    text="Confirmar"
                    color={ButtonColor.Green} 
                    onClick={onSave}
                />
            </DialogActions>

        </Dialog>
    );
}