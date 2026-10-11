"use client";

import { useEffect, useState } from "react";

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
    useMediaQuery,
} from "@mui/material";
import { Add, Close, Delete } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import Thumb from "@/src/components/image/Thumb";
import { parsePreco } from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    listarIngredientes,
    type Ingrediente,
} from "@/src/services/ingredientes";
import type {
    Produto,
    ProdutoInput,
    ProdutoStatus,
} from "@/src/services/produtos";
import { listarTamanhos, type Tamanho } from "@/src/services/tamanhos";

import NovoTamanhoDialog from "./components/NovoTamanhoDialog";

interface ProdutosDialogProps {
    open: boolean;
    /** Produto sendo editado. `null` = criando um novo. */
    produto: Produto | null;
    onClose: () => void;
    /** Devolve true quando o dialog pode ser fechado (salvou). */
    onSave: (input: ProdutoInput) => Promise<boolean>;
}

export default function ProdutosDialog({
    open,
    produto,
    onClose,
    onSave,
}: ProdutosDialogProps) {
    const fullScreen = useMediaQuery("(max-width:639px)");

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
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
            <ProdutosForm produto={produto} onClose={onClose} onSave={onSave} />
        </Dialog>
    );
}

interface TamanhoForm {
    key: number;
    sizeId: number | "";
    price: string;
    status: ProdutoStatus;
}

let proximaChave = 1;
const novaChave = () => proximaChave++;

const tamanhoVazio = (): TamanhoForm => ({
    key: novaChave(),
    sizeId: "",
    price: "",
    status: "ACTIVE",
});

interface ProdutosFormProps {
    produto: Produto | null;
    onClose: () => void;
    onSave: (input: ProdutoInput) => Promise<boolean>;
}

function ProdutosForm({ produto, onClose, onSave }: ProdutosFormProps) {
    const editando = produto !== null;

    const [nome, setNome] = useState(produto?.name ?? "");
    const [descricao, setDescricao] = useState(produto?.description ?? "");
    const [ingredientIds, setIngredientIds] = useState<number[]>(
        () => produto?.ingredientes.map((i) => i.ingredientId) ?? []
    );
    const [sizes, setSizes] = useState<TamanhoForm[]>(() =>
        produto
            ? produto.tamanhos.map((t) => ({
                  key: novaChave(),
                  sizeId: t.sizeId,
                  price: String(t.price),
                  status: t.status,
              }))
            : [tamanhoVazio()]
    );

    // Catálogos vindos da API
    const [catalogoIngredientes, setCatalogoIngredientes] = useState<
        Ingrediente[]
    >([]);
    const [catalogoTamanhos, setCatalogoTamanhos] = useState<Tamanho[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCatalogo, setErroCatalogo] = useState<string | null>(null);

    const [ingredientesAnchorEl, setIngredientesAnchorEl] =
        useState<null | HTMLElement>(null);
    const [novoTamanhoAberto, setNovoTamanhoAberto] = useState(false);

    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        let cancelado = false;

        Promise.all([listarIngredientes(), listarTamanhos()])
            .then(([ingredientes, tamanhos]) => {
                if (!cancelado) {
                    setCatalogoIngredientes(ingredientes);
                    setCatalogoTamanhos(tamanhos);
                }
            })
            .catch((erro) => {
                if (!cancelado) {
                    setErroCatalogo(mensagemDeErro(erro));
                }
            })
            .finally(() => {
                if (!cancelado) {
                    setCarregando(false);
                }
            });

        return () => {
            cancelado = true;
        };
    }, []);

    const toggleIngrediente = (id: number) => {
        setIngredientIds((atuais) =>
            atuais.includes(id)
                ? atuais.filter((atual) => atual !== id)
                : [...atuais, id]
        );
    };

    const ingredientesSelecionados = ingredientIds
        .map((id) => catalogoIngredientes.find((i) => i.id === id))
        .filter((i): i is Ingrediente => Boolean(i));

    const adicionarTamanho = () => {
        setSizes((atuais) => [...atuais, tamanhoVazio()]);
    };

    const removerTamanho = (key: number) => {
        setSizes((atuais) => atuais.filter((s) => s.key !== key));
    };

    const atualizarTamanho = (key: number, dados: Partial<TamanhoForm>) => {
        setSizes((atuais) =>
            atuais.map((s) => (s.key === key ? { ...s, ...dados } : s))
        );
    };

    // Tamanho recém-criado no catálogo: já entra selecionado em um card vazio (ou em um novo).
    const handleTamanhoCriado = (tamanho: Tamanho) => {
        setCatalogoTamanhos((atuais) => [...atuais, tamanho]);
        setNovoTamanhoAberto(false);

        setSizes((atuais) => {
            const vazio = atuais.find((s) => s.sizeId === "");

            if (vazio) {
                return atuais.map((s) =>
                    s.key === vazio.key ? { ...s, sizeId: tamanho.id } : s
                );
            }

            return [
                ...atuais,
                { ...tamanhoVazio(), sizeId: tamanho.id },
            ];
        });
    };

    const precoInvalido = (preco: string) => {
        const numero = parsePreco(preco);

        return preco.trim() === "" || Number.isNaN(numero) || numero < 0;
    };

    const nomeInvalido = nome.trim() === "";
    const semTamanhos = sizes.length === 0;
    const tamanhoInvalido = (s: TamanhoForm) =>
        s.sizeId === "" || precoInvalido(s.price);

    const handleSalvar = async () => {
        setTentouSalvar(true);

        if (nomeInvalido || semTamanhos || sizes.some(tamanhoInvalido)) {
            return;
        }

        setSalvando(true);

        const salvou = await onSave({
            name: nome,
            description: descricao,
            status: produto?.status ?? "ACTIVE",
            ingredientIds,
            sizes: sizes.map((s) => ({
                sizeId: s.sizeId as number,
                price: parsePreco(s.price),
                status: s.status,
            })),
        });

        if (!salvou) {
            setSalvando(false);
        }
    };

    return (
        <>
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
                            {editando ? "Editar Produto" : "Criar Produto"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Cadastre o produto e configure seus diferentes
                            tamanhos.
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

            <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
                <div className="pt-3">
                    {erroCatalogo && (
                        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {erroCatalogo} Feche e abra o formulário para tentar
                            novamente.
                        </div>
                    )}

                    <div className="mb-8">
                        <div className="mb-5">
                            <h3 className="pt-2 text-base font-semibold text-gray-800">
                                Informações gerais
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Essas informações serão utilizadas em todos os
                                tamanhos do produto.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 pt-3">
                            <TextField
                                label="Nome do Produto"
                                placeholder="Ex: Pastel de Carne"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                fullWidth
                                required
                                error={tentouSalvar && nomeInvalido}
                                helperText={
                                    tentouSalvar && nomeInvalido
                                        ? "Informe o nome do produto."
                                        : undefined
                                }
                            />

                            <TextField
                                label="Descrição"
                                placeholder="Ex: Pastel crocante recheado com carne bovina temperada"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                fullWidth
                                multiline
                                minRows={3}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 border-t border-gray-200 pt-2 lg:grid-cols-2 lg:gap-6">
                        {/* Ingredientes */}
                        <div className="min-w-0">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Ingredientes
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Selecione os ingredientes do produto.
                                    </p>
                                </div>

                                <Button
                                    text="Gerenciar"
                                    onClick={(event) =>
                                        setIngredientesAnchorEl(
                                            event.currentTarget
                                        )
                                    }
                                    color={ButtonColor.Secondary}
                                />
                            </div>

                            <Menu
                                anchorEl={ingredientesAnchorEl}
                                open={Boolean(ingredientesAnchorEl)}
                                onClose={() => setIngredientesAnchorEl(null)}
                                transitionDuration={0}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            width: 380,
                                            maxWidth: "calc(100vw - 32px)",
                                            maxHeight: 350,
                                        },
                                    },
                                }}
                            >
                                {catalogoIngredientes.length === 0 && (
                                    <MenuItem disabled>
                                        {carregando
                                            ? "Carregando ingredientes..."
                                            : "Nenhum ingrediente cadastrado."}
                                    </MenuItem>
                                )}

                                {catalogoIngredientes.map((ingrediente) => (
                                    <MenuItem
                                        key={ingrediente.id}
                                        onClick={() =>
                                            toggleIngrediente(ingrediente.id)
                                        }
                                    >
                                        <Checkbox
                                            checked={ingredientIds.includes(
                                                ingrediente.id
                                            )}
                                            size="small"
                                            disableRipple
                                            disableFocusRipple
                                            disableTouchRipple
                                        />

                                        <div className="mr-3">
                                            <Thumb src={ingrediente.imageUrl} />
                                        </div>

                                        <div className="flex min-w-0 flex-row items-center justify-between gap-3">
                                            <span className="truncate text-sm text-gray-700">
                                                {ingrediente.name}
                                            </span>

                                            {ingrediente.status !== "ACTIVE" && (
                                                <Chip
                                                    label="Esgotado"
                                                    size="small"
                                                />
                                            )}
                                        </div>
                                    </MenuItem>
                                ))}
                            </Menu>

                            {carregando ? (
                                <div className="flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                                    Carregando ingredientes...
                                </div>
                            ) : ingredientesSelecionados.length === 0 ? (
                                <div className="flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600">
                                            Nenhum ingrediente selecionado
                                        </p>

                                        <p className="mt-1 text-xs text-gray-400">
                                            Clique em &quot;Gerenciar&quot; para
                                            selecionar ingredientes.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
                                    {ingredientesSelecionados.map(
                                        (ingrediente) => (
                                            <div
                                                key={ingrediente.id}
                                                className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3"
                                            >
                                                <Thumb
                                                    src={ingrediente.imageUrl}
                                                />

                                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                    <span className="truncate text-sm font-medium text-gray-800">
                                                        {ingrediente.name}
                                                    </span>

                                                    <Chip
                                                        label={
                                                            ingrediente.status ===
                                                            "ACTIVE"
                                                                ? "Disponível"
                                                                : "Esgotado"
                                                        }
                                                        size="small"
                                                        sx={{
                                                            width: "fit-content",
                                                        }}
                                                    />
                                                </div>

                                                <IconButton
                                                    size="small"
                                                    disableRipple
                                                    title="Remover ingrediente"
                                                    onClick={() =>
                                                        toggleIngrediente(
                                                            ingrediente.id
                                                        )
                                                    }
                                                    sx={{ color: "#666" }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tamanhos */}
                        <div className="min-w-0">
                            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">
                                        Tamanhos
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Escolha o tamanho e defina o preço.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        text="Novo tamanho"
                                        onClick={() =>
                                            setNovoTamanhoAberto(true)
                                        }
                                        color={ButtonColor.Secondary}
                                    />

                                    <Button
                                        text="Adicionar"
                                        icon={Add}
                                        onClick={adicionarTamanho}
                                        color={ButtonColor.Secondary}
                                    />
                                </div>
                            </div>

                            {semTamanhos ? (
                                <div
                                    className={`flex min-h-[210px] items-center justify-center rounded-md border border-dashed bg-gray-50 ${
                                        tentouSalvar
                                            ? "border-red-400"
                                            : "border-gray-300"
                                    }`}
                                >
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-gray-600">
                                            Nenhum tamanho adicionado
                                        </p>

                                        <p
                                            className={`mt-1 text-xs ${
                                                tentouSalvar
                                                    ? "text-red-600"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            O produto precisa de pelo menos um
                                            tamanho, que define o preço.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto pr-1">
                                    {sizes.map((size, index) => {
                                        const usadosPorOutros = new Set(
                                            sizes
                                                .filter(
                                                    (outro) =>
                                                        outro.key !== size.key
                                                )
                                                .map((outro) => outro.sizeId)
                                        );

                                        const opcoes = catalogoTamanhos.filter(
                                            (t) => !usadosPorOutros.has(t.id)
                                        );

                                        const invalido =
                                            tentouSalvar && tamanhoInvalido(size);

                                        return (
                                            <div
                                                key={size.key}
                                                className="rounded-md border border-gray-200 bg-gray-50 p-4"
                                            >
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Tamanho {index + 1}
                                                    </span>

                                                    <IconButton
                                                        size="small"
                                                        disableRipple
                                                        title="Remover tamanho"
                                                        onClick={() =>
                                                            removerTamanho(
                                                                size.key
                                                            )
                                                        }
                                                        sx={{ color: "#666" }}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <TextField
                                                        select
                                                        label="Tamanho"
                                                        value={carregando ? "" : size.sizeId}
                                                        onChange={(e) =>
                                                            atualizarTamanho(
                                                                size.key,
                                                                {
                                                                    sizeId: Number(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                                }
                                                            )
                                                        }
                                                        fullWidth
                                                        size="small"
                                                        required
                                                        disabled={carregando}
                                                        error={
                                                            invalido &&
                                                            size.sizeId === ""
                                                        }
                                                        helperText={
                                                            invalido &&
                                                            size.sizeId === ""
                                                                ? "Escolha um tamanho."
                                                                : !carregando &&
                                                                    opcoes.length ===
                                                                        0
                                                                  ? 'Nenhum tamanho disponível. Use "Novo tamanho".'
                                                                  : undefined
                                                        }
                                                    >
                                                        {opcoes.map((t) => (
                                                            <MenuItem
                                                                key={t.id}
                                                                value={t.id}
                                                            >
                                                                {t.name}
                                                            </MenuItem>
                                                        ))}
                                                    </TextField>

                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <TextField
                                                            label="Preço"
                                                            type="number"
                                                            placeholder="0,00"
                                                            value={size.price}
                                                            onChange={(e) =>
                                                                atualizarTamanho(
                                                                    size.key,
                                                                    {
                                                                        price: e
                                                                            .target
                                                                            .value,
                                                                    }
                                                                )
                                                            }
                                                            fullWidth
                                                            size="small"
                                                            required
                                                            error={
                                                                invalido &&
                                                                precoInvalido(
                                                                    size.price
                                                                )
                                                            }
                                                            helperText={
                                                                invalido &&
                                                                precoInvalido(
                                                                    size.price
                                                                )
                                                                    ? "Informe um preço válido."
                                                                    : undefined
                                                            }
                                                            slotProps={{
                                                                htmlInput: {
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

                                                        <TextField
                                                            select
                                                            label="Status"
                                                            value={size.status}
                                                            onChange={(e) =>
                                                                atualizarTamanho(
                                                                    size.key,
                                                                    {
                                                                        status: e
                                                                            .target
                                                                            .value as ProdutoStatus,
                                                                    }
                                                                )
                                                            }
                                                            fullWidth
                                                            size="small"
                                                        >
                                                            <MenuItem value="ACTIVE">
                                                                Ativo
                                                            </MenuItem>
                                                            <MenuItem value="INACTIVE">
                                                                Inativo
                                                            </MenuItem>
                                                        </TextField>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>

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
                              : "Criar Produto"
                    }
                    color={ButtonColor.Green}
                    onClick={salvando || carregando ? () => undefined : handleSalvar}
                />
            </DialogActions>

            <NovoTamanhoDialog
                open={novoTamanhoAberto}
                onClose={() => setNovoTamanhoAberto(false)}
                onCriado={handleTamanhoCriado}
            />
        </>
    );
}
