"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from "@mui/material";
import { Add, Close, Image as ImageIcon } from "@mui/icons-material";
import Image from "next/image";

import Button, {
    ButtonColor,
} from "@/src/components/button/Button";

interface IngredientesDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;

    nome: string;
    descricao: string;
    imagem: string | null;
    preco: string;
    status: string;

    setNome: (value: string) => void;
    setDescricao: (value: string) => void;
    setImagem: (value: string | null) => void;
    setPreco: (value: string) => void;
    setStatus: (value: string) => void;

}

export default function IngredientesDialog({
    open,
    onClose,
    onSave,
    nome,
    descricao,
    imagem,
    preco,
    setNome,
    setDescricao,
    setImagem,
    setPreco,
}: IngredientesDialogProps) {
    const handleImagem = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const imageUrl = URL.createObjectURL(file);

        setImagem(imageUrl);
    };

    const handleClose = () => {
        onClose();
        setImagem(null);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: "12px",
                        overflow: "hidden",
                    },
                },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    px: 4,
                    pt: 3,
                    pb: 2,
                    borderBottom: "1px solid #eeeeee",
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#1f2937]">
                            Criar Ingrediente
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Preencha as informações abaixo para cadastrar um
                            novo ingrediente.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </DialogTitle>

            {/* Content */}
            <DialogContent
                sx={{
                    px: 4,
                    py: 3,
                }}
            >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-[340px_1fr] pt-5">
                    <div>   
                        <label
                            htmlFor="ingrediente-image"
                            className="flex h-[230px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100"
                        >
                            {imagem ? (
                                <Image
                                    src={imagem}
                                    alt="Imagem do ingrediente"
                                    width={300}
                                    height={220}
                                    unoptimized
                                    className="h-full w-full object-contain p-3"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                        <ImageIcon
                                            sx={{
                                                color: "#9ca3af",
                                                fontSize: 28,
                                            }}
                                        />
                                    </div>

                                    <span className="text-sm font-medium text-gray-600">
                                        Clique para adicionar uma foto
                                    </span>

                                    <span className="text-xs text-gray-400">
                                        JPG, PNG ou WEBP
                                    </span>
                                </div>
                            )}
                        </label>

                        <p className="mt-2 text-xs text-gray-400">
                            Tamanho máximo: 5MB
                        </p>

                        <input
                            id="ingrediente-image"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleImagem}
                        />
                    </div>

                    
                    <div className="flex flex-col gap-6">
                        <TextField
                            label="Nome do Ingrediente"
                            placeholder="Ex: Queijo"
                            value={nome}
                            onChange={(e) =>
                                setNome(e.target.value)
                            }
                            fullWidth
                            required
                        />

                        <TextField
                            label="Descrição"
                            placeholder="Ex: Queijo mussarela fatiado"
                            value={descricao}
                            onChange={(e) =>
                                setDescricao(e.target.value)
                            }
                            fullWidth
                            multiline
                            minRows={5}
                            required
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <TextField
                        label="Preço (adicional de produtos)"
                        type="number"
                        placeholder="0,00"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        fullWidth
                        required
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
                </div>
            </DialogContent>

            {/* Footer */}
            <DialogActions
                sx={{
                    px: 4,
                    py: 2.5,
                    borderTop: "1px solid #eeeeee",
                    gap: 1.5,
                }}
            >
                <Button
                    text="Cancelar"
                    onClick={handleClose}
                    color={ButtonColor.Secondary}
                />

                <Button
                    text="Criar Ingrediente"
                    color={ButtonColor.Green}
                    onClick={onSave}
                />
            </DialogActions>
        </Dialog>
    );
}