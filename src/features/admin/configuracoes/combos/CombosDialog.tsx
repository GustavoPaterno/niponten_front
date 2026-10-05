"use client";

import { useState } from "react";

import {
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Menu,
    MenuItem,
    TextField,
} from "@mui/material";

import {
    Close,
    Image as ImageIcon,
} from "@mui/icons-material";

import Image from "next/image";

import Button, {
    ButtonColor,
} from "@/src/components/button/Button";

interface Produto {
    id: number;
    name: string;
    imageUrl: string | null;
    description: string;
    price: number;
    status: "ACTIVE" | "INACTIVE";
}

interface Combo {
    id: number;
    name: string;
    imageUrl: string | null;
    description: string;
    price: number;
    status: "ACTIVE" | "INACTIVE";
    startDate: string;
    endDate: string;
    products: {
        productId: number;
    }[];
}

interface ProdutosDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (combo: Combo) => void;
}

const produtosDisponiveis: Produto[] = [
    {
        id: 1,
        name: "Pastel de Carne",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel crocante recheado com carne bovina temperada",
        price: 9.9,
        status: "ACTIVE",
    },
    {
        id: 2,
        name: "Pastel de Queijo",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel crocante recheado com queijo mussarela",
        price: 9.5,
        status: "ACTIVE",
    },
    {
        id: 3,
        name: "Pastel de Carne com Queijo",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel recheado com carne bovina e queijo",
        price: 11.9,
        status: "ACTIVE",
    },
    {
        id: 4,
        name: "Pastel de Bacon com Queijo",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel recheado com bacon crocante e queijo",
        price: 12.9,
        status: "ACTIVE",
    },
    {
        id: 5,
        name: "Pastel de Frango com Catupiri",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel recheado com frango cremoso e catupiri",
        price: 12.5,
        status: "ACTIVE",
    },
    {
        id: 6,
        name: "Pastel de Chocolate",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel doce recheado com chocolate ao leite",
        price: 10.9,
        status: "ACTIVE",
    },
    {
        id: 7,
        name: "Pastel de Chocolate Branco",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel doce recheado com chocolate branco",
        price: 11.5,
        status: "ACTIVE",
    },
    {
        id: 8,
        name: "Pastel de Queijo com Catupiri",
        imageUrl: "/images/marusan-logo.jpg",
        description:
            "Pastel recheado com queijo mussarela e catupiri",
        price: 11.9,
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
    const [preco, setPreco] = useState("");
    const [imagem, setImagem] =
        useState<string | null>(null);

    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const [products, setProducts] = useState<number[]>(
        []
    );

    const [
        produtosAnchorEl,
        setProdutosAnchorEl,
    ] = useState<null | HTMLElement>(null);

    const produtosMenuOpen =
        Boolean(produtosAnchorEl);

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
        setDescricao("");
        setPreco("");
        setImagem(null);

        setDataInicio("");
        setDataFim("");

        setProducts([]);

        setProdutosAnchorEl(null);
    };

    const handleProdutosMenu = (
        event: React.MouseEvent<HTMLButtonElement>
    ) => {
        setProdutosAnchorEl(event.currentTarget);
    };

    const fecharProdutosMenu = () => {
        setProdutosAnchorEl(null);
    };

    const toggleProduto = (id: number) => {
        setProducts((currentProducts) =>
            currentProducts.includes(id)
                ? currentProducts.filter(
                    (productId) =>
                        productId !== id
                )
                : [...currentProducts, id]
        );
    };

    const handleSalvar = () => {
        const combo: Combo = {
            id: 0,

            name: nome,

            imageUrl: imagem,

            description: descricao,

            price: Number(preco),

            status: "ACTIVE",

            startDate: dataInicio,

            endDate: dataFim,

            products: products.map((productId) => ({
                productId,
            })),
        };

        onSave(combo);

        resetForm();
    };

    const produtosSelecionados =
        products
            .map((productId) =>
                produtosDisponiveis.find(
                    (produto) =>
                        produto.id === productId
                )
            )
            .filter(
                (
                    produto
                ): produto is Produto =>
                    Boolean(produto)
            );

    return (
        <Dialog
            open={open}
            onClose={() => {
                onClose();
                resetForm();
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
                    borderBottom:
                        "1px solid #eeeeee",
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-[#1f2937]">
                            Criar Combo
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Cadastre o combo e
                            configure os produtos
                            que fazem parte dele.
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
                    {/* INFORMAÇÕES GERAIS */}
                    <div className="mb-8">
                        <div className="mb-5">
                            <h3 className="pt-2 text-base font-semibold text-gray-800">
                                Informações gerais
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Configure as
                                informações do
                                combo.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 pt-5 md:grid-cols-[340px_1fr]">
                            {/* IMAGEM */}
                            <div>
                                <label
                                    htmlFor="combo-image"
                                    className="flex h-[230px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50 transition hover:border-gray-400 hover:bg-gray-100"
                                >
                                    {imagem ? (
                                        <Image
                                            src={imagem}
                                            alt="Imagem do combo"
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
                                                Clique para adicionar
                                                uma foto
                                            </span>

                                            <span className="text-xs text-gray-400">
                                                JPG, PNG ou WEBP
                                            </span>
                                        </div>
                                    )}
                                </label>

                                <p className="mt-2 text-xs text-gray-400">
                                    Tamanho máximo:
                                    5MB
                                </p>

                                <input
                                    id="combo-image"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={
                                        handleImagem
                                    }
                                />
                            </div>

                            {/* CAMPOS */}
                            <div className="flex flex-col gap-6">
                                <div className="flex gap-6">
                                    <TextField
                                        label="Nome do Combo"
                                        placeholder="Ex: Combo Família"
                                        value={nome}
                                        className="flex-1"
                                        onChange={(e) => setNome(e.target.value)}
                                        required
                                    />

                                    <TextField
                                        label="Preço"
                                        type="number"
                                        placeholder="0,00"
                                        value={preco}
                                        className="flex-3"
                                        onChange={(e) => setPreco(e.target.value)}
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

                                <TextField
                                    label="Descrição"
                                    placeholder="Ex: Combo com 3 pastéis para toda a família"
                                    value={descricao}
                                    onChange={(e) =>
                                        setDescricao(
                                            e.target.value
                                        )
                                    }
                                    fullWidth
                                    multiline
                                    minRows={5}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* DATAS */}
                    <div className="mt-3 pt-5 mb-8 pb-5 flex gap-6 border-t border-gray-200 md:grid-cols-2">
                        <TextField
                            label="Data de início"
                            type="datetime-local"
                            value={dataInicio}
                            onChange={(e) =>
                                setDataInicio(
                                    e.target.value
                                )
                            }
                            fullWidth
                            required
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />

                        <TextField
                            label="Data de fim"
                            type="datetime-local"
                            value={dataFim}
                            onChange={(e) =>
                                setDataFim(
                                    e.target.value
                                )
                            }
                            fullWidth
                            required
                            slotProps={{
                                inputLabel: {
                                    shrink: true,
                                },
                            }}
                        />
                    </div>

                    {/* PRODUTOS */}
                    <div className="border-t border-gray-200 pt-5">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">
                                    Produtos
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Selecione os produtos
                                    que fazem parte
                                    do combo.
                                </p>
                            </div>

                            <Button
                                text="Gerenciar"
                                onClick={
                                    handleProdutosMenu
                                }
                                color={
                                    ButtonColor.Secondary
                                }
                            />
                        </div>

                        {/* MENU */}
                        <Menu
                            anchorEl={
                                produtosAnchorEl
                            }
                            open={produtosMenuOpen}
                            onClose={
                                fecharProdutosMenu
                            }
                            transitionDuration={0}
                            slotProps={{
                                paper: {
                                    sx: {
                                        width: 420,
                                        maxHeight: 400,
                                    },
                                },
                            }}
                        >
                            {produtosDisponiveis.map(
                                (produto) => {
                                    const selecionado =
                                        products.includes(
                                            produto.id
                                        );

                                    return (
                                        <MenuItem
                                            key={
                                                produto.id
                                            }
                                            onClick={() =>
                                                toggleProduto(
                                                    produto.id
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

                                            {produto.imageUrl ? (
                                                <Image
                                                    src={
                                                        produto.imageUrl
                                                    }
                                                    alt={
                                                        produto.name
                                                    }
                                                    width={
                                                        40
                                                    }
                                                    height={
                                                        40
                                                    }
                                                    className="mr-3 h-10 w-10 shrink-0 rounded-md object-cover"
                                                />
                                            ) : (
                                                <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100">
                                                    <Image
                                                        src="/images/marusan-logo.jpg"
                                                        alt={
                                                            produto.name
                                                        }
                                                        width={
                                                            40
                                                        }
                                                        height={
                                                            40
                                                        }
                                                        className="h-10 w-10 rounded-md object-cover"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                                <div className="flex min-w-0">
                                                    <span className="truncate text-sm text-gray-700">
                                                        {
                                                            produto.name
                                                        }
                                                    </span>

                                                    <span className="text-xs text-gray-400">
                                                        R${" "}
                                                        {produto.price
                                                            .toFixed(
                                                                2
                                                            )
                                                            .replace(
                                                                ".",
                                                                ","
                                                            )}
                                                    </span>
                                                </div>

                                                <Chip
                                                    label={
                                                        produto.status ===
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

                        
                        {produtosSelecionados.length ===
                            0 ? (
                            <div className="flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                <div className="text-center h-15 flex items-center justify-center flex-col">
                                    <p className="text-sm font-medium text-gray-600">
                                        Nenhum produto
                                        selecionado
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Clique em
                                        "Gerenciar"
                                        para selecionar
                                        os produtos do
                                        combo.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                {produtosSelecionados.map(
                                    (produto) => (
                                        <div
                                            key={
                                                produto.id
                                            }
                                            className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3"
                                        >
                                            {produto.imageUrl ? (
                                                <Image
                                                    src={
                                                        produto.imageUrl
                                                    }
                                                    alt={
                                                        produto.name
                                                    }
                                                    width={
                                                        64
                                                    }
                                                    height={
                                                        64
                                                    }
                                                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                                                />
                                            ) : (
                                                <Image
                                                    src="/images/marusan-logo.jpg"
                                                    alt={
                                                        produto.name
                                                    }
                                                    width={
                                                        64
                                                    }
                                                    height={
                                                        64
                                                    }
                                                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                                                />
                                            )}

                                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                <span className="truncate text-sm font-medium text-gray-800">
                                                    {
                                                        produto.name
                                                    }
                                                </span>

                                                <span className="text-xs text-gray-500">
                                                    R${" "}
                                                    {produto.price
                                                        .toFixed(
                                                            2
                                                        )
                                                        .replace(
                                                            ".",
                                                            ","
                                                        )}
                                                </span>

                                                <Chip
                                                    label={
                                                        produto.status ===
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
                </div>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 4,
                    py: 2.5,
                    borderTop:
                        "1px solid #eeeeee",
                    gap: 1.5,
                }}
            >
                <Button
                    text="Cancelar"
                    onClick={onClose}
                    color={ButtonColor.Secondary}
                />

                <Button
                    text="Criar Combo"
                    color={ButtonColor.Green}
                    onClick={handleSalvar}
                />
            </DialogActions>
        </Dialog>
    );
}