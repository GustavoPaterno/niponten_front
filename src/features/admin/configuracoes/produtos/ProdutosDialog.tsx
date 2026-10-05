"use client";

import { useState } from "react";

import {
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    TextField,
} from "@mui/material";

import {
    Add,
    Close,
    Delete,
    Image as ImageIcon,
} from "@mui/icons-material";

import Image from "next/image";

import Button, {
    ButtonColor,
} from "@/src/components/button/Button";

interface ProdutoSize {
    id: number;
    name: string;
    description: string;
    price: string;
}

interface Ingrediente {
    id: number;
    name: string;
    imageUrl: string | null;
    status: "ACTIVE" | "INACTIVE";
}

interface Produto {
    id: number;
    name: string;
    imageUrl: string | null;
    description: string;
    status: string;
    ingredients: {
        id: number;
        productId: number;
        ingredientId: number;
    }[];
    sizes: {
        id: number;
        productId: number;
        sizeId: number;
        name: string;
        price: number;
        status: string;
    }[];
}

interface ProdutosDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (produto: Produto) => void;
}

const ingredientesDisponiveis: Ingrediente[] = [
    {
        id: 1,
        name: "Queijo",
        imageUrl: null,
        status: "ACTIVE",
    },
    {
        id: 2,
        name: "Carne",
        imageUrl: null,
        status: "ACTIVE",
    },
    {
        id: 3,
        name: "Catupiry",
        imageUrl: null,
        status: "ACTIVE",
    },
    {
        id: 4,
        name: "Bacon",
        imageUrl: null,
        status: "ACTIVE",
    },
    {
        id: 5,
        name: "Chocolate",
        imageUrl: null,
        status: "INACTIVE",
    },
];

export default function ProdutosDialog({
    open,
    onClose,
    onSave,
}: ProdutosDialogProps) {
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [imagem, setImagem] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<number[]>([]);
    const [sizes, setSizes] = useState<ProdutoSize[]>([]);

    const [
        ingredientesAnchorEl,
        setIngredientesAnchorEl,
    ] = useState<null | HTMLElement>(null);

    const ingredientesMenuOpen =
        Boolean(ingredientesAnchorEl);

    const handleImagem = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const imageUrl = URL.createObjectURL(file);

        setImagem((previousImage) => {
            if (previousImage) {
                URL.revokeObjectURL(previousImage);
            }

            return imageUrl;
        });
    };

    const resetForm = () => {
        if (imagem) {
            URL.revokeObjectURL(imagem);
        }

        setNome("");
        setImagem(null);
        setIngredients([]);
        setSizes([]);
        setIngredientesAnchorEl(null);
    };

    const handleIngredientesMenu = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setIngredientesAnchorEl(event.currentTarget);
    };

    const fecharIngredientesMenu = () => {
        setIngredientesAnchorEl(null);
    };

    const toggleIngrediente = (id: number) => {
        setIngredients((currentIngredients) =>
            currentIngredients.includes(id)
                ? currentIngredients.filter(
                    (ingredientId) =>
                        ingredientId !== id
                )
                : [...currentIngredients, id]
        );
    };

    const adicionarTamanho = () => {
        setSizes((currentSizes) => [
            ...currentSizes,
            {
                id: Date.now(),
                name: "",
                description: "",
                price: "",
            },
        ]);
    };

    const removerTamanho = (id: number) => {
        setSizes((currentSizes) =>
            currentSizes.filter((size) => size.id !== id)
        );
    };

    const atualizarTamanho = (
        id: number,
        field: keyof ProdutoSize,
        value: string
    ) => {
        setSizes((currentSizes) =>
            currentSizes.map((size) =>
                size.id === id
                    ? {
                        ...size,
                        [field]: value,
                    }
                    : size
            )
        );
    };

    const handleSalvar = () => {
        const produto: Produto = {
            id: 0,
            name: nome,
            imageUrl: imagem,
            description: "",
            status: "ACTIVE",

            ingredients: ingredients.map(
                (ingredientId) => ({
                    id: 0,
                    productId: 0,
                    ingredientId,
                })
            ),

            sizes: sizes.map((size) => ({
                id: 0,
                productId: 0,
                sizeId: 0,
                name: size.name,
                price: Number(size.price),
                status: "ACTIVE",
            })),
        };

        onSave(produto);
        resetForm();
    };

    const ingredientesSelecionados =
        ingredients
            .map((ingredientId) =>
                ingredientesDisponiveis.find(
                    (ingrediente) =>
                        ingrediente.id === ingredientId
                )
            )
            .filter(
                (
                    ingrediente
                ): ingrediente is Ingrediente =>
                    Boolean(ingrediente)
            );

    return (
        <Dialog
            open={open}
            onClose={()=> {
                onClose();
                setImagem(null);
            }}
            fullWidth
            maxWidth="lg"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: "12px",
                        overflow: "hidden",
                    },
                },
            }}
        >
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
                            Criar Produto
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Cadastre o produto e configure seus
                            diferentes tamanhos.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500"
                    >
                        <Close fontSize="small" />
                    </button>
                </div>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 4,
                    py: 3,
                }}
            >
                <div className="pt-3">
                    <div className="mb-8">
                        <div className="mb-5">
                            <h3 className="pt-2 text-base font-semibold text-gray-800">
                                Informações gerais
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Essas informações serão utilizadas em
                                todos os tamanhos do produto.
                            </p>
                        </div>

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
                                    label="Nome do Produto"
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
                    </div>

                    <div className="grid grid-cols-2 gap-6 border-t border-gray-200 pt-2">
                        <div className="min-w-0">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Ingredientes
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Selecione os ingredientes do
                                        produto.
                                    </p>
                                </div>

                                <Button
                                    text="Gerenciar"
                                    onClick={
                                        handleIngredientesMenu
                                    }
                                    color={
                                        ButtonColor.Secondary
                                    }
                                />
                            </div>

                            <Menu
                                anchorEl={
                                    ingredientesAnchorEl
                                }
                                open={ingredientesMenuOpen}
                                onClose={
                                    fecharIngredientesMenu
                                }
                                transitionDuration={0}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            width: 380,
                                            maxHeight: 350,
                                        },
                                    },
                                }}
                            >
                                {ingredientesDisponiveis.map(
                                    (ingrediente) => {
                                        const selecionado =
                                            ingredients.includes(
                                                ingrediente.id
                                            );

                                        return (
                                            <MenuItem
                                                key={
                                                    ingrediente.id
                                                }
                                                onClick={() =>
                                                    toggleIngrediente(
                                                        ingrediente.id
                                                    )
                                                }
                                            >
                                                <Checkbox
                                                    checked={
                                                        selecionado
                                                    }
                                                    size="small"
                                                    disableRipple
                                                    disableFocusRipple
                                                    disableTouchRipple
                                                />

                                                {ingrediente.imageUrl ? (
                                                    <Image
                                                        src={
                                                            ingrediente.imageUrl
                                                        }
                                                        alt={
                                                            ingrediente.name
                                                        }
                                                        width={40}
                                                        height={40}
                                                        className="mr-3 h-10 w-10 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                                                        <Image
                                                        src="/images/marusan-logo.jpg"
                                                        alt={
                                                            ingrediente.name
                                                        }
                                                        width={40}
                                                        height={40}
                                                        className="mr-3 h-10 w-10 rounded-md object-cover"
                                                    />
                                                        
                                                    </div>
                                                )}

                                                <div className="flex flex-row min-w-0  items-center justify-between gap-3">
                                                    <span className="truncate text-sm text-gray-700">
                                                        {
                                                            ingrediente.name
                                                        }
                                                    </span>

                                                    <Chip
                                                        label={
                                                            ingrediente.status ===
                                                                "ACTIVE"
                                                                ? "Ativo"
                                                                : "Inativo"
                                                        }
                                                        size="small"
                                                    />
                                                </div>
                                            </MenuItem>
                                        );
                                    }
                                )}
                            </Menu>

                            {ingredientesSelecionados.length ===
                                0 ? (
                                <div className="flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600">
                                            Nenhum ingrediente
                                            selecionado
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Clique em "Editar" para
                                            selecionar ingredientes.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
                                    {ingredientesSelecionados.map(
                                        (ingrediente) => (
                                            <div
                                                key={
                                                    ingrediente.id
                                                }
                                                className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3"
                                            >
                                                {ingrediente.imageUrl ? (
                                                    <Image
                                                        src={
                                                            ingrediente.imageUrl
                                                        }
                                                        alt={
                                                            ingrediente.name
                                                        }
                                                        width={56}
                                                        height={56}
                                                        className="h-14 w-14 shrink-0 rounded-md object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                                                        <Image
                                                        src="/images/marusan-logo.jpg"
                                                        alt={
                                                            ingrediente.name
                                                        }
                                                        width={56}
                                                        height={56}
                                                        className="h-14 w-14 shrink-0 rounded-md object-cover"
                                                    />
                                                        
                                                    </div>
                                                )}

                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                    <span className="truncate text-sm font-medium text-gray-800">
                                                        {
                                                            ingrediente.name
                                                        }
                                                    </span>

                                                    <Chip
                                                        label={
                                                            ingrediente.status ===
                                                                "ACTIVE"
                                                                ? "Ativo"
                                                                : "Inativo"
                                                        }
                                                        size="small"
                                                        sx={{
                                                            width: "fit-content",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Tamanhos
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Configure tamanho, descrição
                                        e preço.
                                    </p>
                                </div>

                                <Button
                                    text="Adicionar"
                                    icon={Add}
                                    onClick={
                                        adicionarTamanho
                                    }
                                    color={
                                        ButtonColor.Secondary
                                    }
                                />
                            </div>

                            {sizes.length === 0 ? (
                                <div className="flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600">
                                            Nenhum tamanho
                                            adicionado
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Adicione um tamanho para
                                            definir o preço.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
                                    {sizes.map(
                                        (size, index) => (
                                            <div
                                                key={size.id}
                                                className="rounded-md border border-gray-200 bg-gray-50 p-4"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Tamanho{" "}
                                                        {index +
                                                            1}
                                                    </span>

                                                    <IconButton
                                                        size="small"
                                                        disableRipple
                                                        onClick={() =>
                                                            removerTamanho(
                                                                size.id
                                                            )
                                                        }
                                                        sx={{
                                                            color: "#666",
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <TextField
                                                        label="Tamanho"
                                                        placeholder="Ex: Pequeno"
                                                        value={
                                                            size.name
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            atualizarTamanho(
                                                                size.id,
                                                                "name",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        fullWidth
                                                        size="small"
                                                        required
                                                    />

                                                    <TextField
                                                        label="Preço"
                                                        type="number"
                                                        placeholder="0,00"
                                                        value={
                                                            size.price
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            atualizarTamanho(
                                                                size.id,
                                                                "price",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        fullWidth
                                                        size="small"
                                                        required
                                                        slotProps={{
                                                            htmlInput:
                                                            {
                                                                min: 0,
                                                                step: "0.01",
                                                            },
                                                            input: {
                                                                startAdornment:
                                                                    (
                                                                        <span className="mr-2 text-sm text-gray-500">
                                                                            R$
                                                                        </span>
                                                                    ),
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>

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
                    onClick={onClose}
                    color={ButtonColor.Secondary}
                />

                <Button
                    text="Criar Produto"
                    color={ButtonColor.Green}
                    onClick={handleSalvar}
                />
            </DialogActions>
        </Dialog>
    );
}