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
import { Close, Delete } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import Thumb from "@/src/components/image/Thumb";
import {
    formatCurrency,
    fromDatetimeInput,
    parsePreco,
    toDatetimeInput,
} from "@/src/lib/format";
import { mensagemDeErro } from "@/src/lib/http";
import {
    MINIMO_PRODUTOS_COMBO,
    type Combo,
    type ComboInput,
} from "@/src/services/combos";
import { listarProdutos, type Produto } from "@/src/services/produtos";

interface CombosDialogProps {
    open: boolean;
    /** Combo sendo editado. `null` = criando um novo. */
    combo: Combo | null;
    onClose: () => void;
    /** Devolve true quando o dialog pode ser fechado (salvou). */
    onSave: (input: ComboInput) => Promise<boolean>;
}

export default function CombosDialog({
    open,
    combo,
    onClose,
    onSave,
}: CombosDialogProps) {
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
            <CombosForm combo={combo} onClose={onClose} onSave={onSave} />
        </Dialog>
    );
}

interface CombosFormProps {
    combo: Combo | null;
    onClose: () => void;
    onSave: (input: ComboInput) => Promise<boolean>;
}

function CombosForm({ combo, onClose, onSave }: CombosFormProps) {
    const editando = combo !== null;

    const [nome, setNome] = useState(combo?.name ?? "");
    const [descricao, setDescricao] = useState(combo?.description ?? "");
    const [preco, setPreco] = useState(combo ? String(combo.price) : "");
    const [dataInicio, setDataInicio] = useState(
        toDatetimeInput(combo?.startDate)
    );
    const [dataFim, setDataFim] = useState(toDatetimeInput(combo?.endDate));
    const [productIds, setProductIds] = useState<number[]>(
        () => combo?.produtos.map((p) => p.productId) ?? []
    );

    const [catalogoProdutos, setCatalogoProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCatalogo, setErroCatalogo] = useState<string | null>(null);

    const [produtosAnchorEl, setProdutosAnchorEl] =
        useState<null | HTMLElement>(null);

    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        let cancelado = false;

        listarProdutos()
            .then((produtos) => {
                if (!cancelado) {
                    setCatalogoProdutos(produtos);
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

    const toggleProduto = (id: number) => {
        setProductIds((atuais) =>
            atuais.includes(id)
                ? atuais.filter((atual) => atual !== id)
                : [...atuais, id]
        );
    };

    const produtosSelecionados = productIds
        .map((id) => catalogoProdutos.find((p) => p.id === id))
        .filter((p): p is Produto => Boolean(p));

    const precoNumero = parsePreco(preco);
    const nomeInvalido = nome.trim() === "";
    const precoInvalido =
        preco.trim() === "" || Number.isNaN(precoNumero) || precoNumero <= 0;
    const poucosProdutos = productIds.length < MINIMO_PRODUTOS_COMBO;
    const periodoInvalido =
        dataInicio !== "" && dataFim !== "" && dataFim <= dataInicio;

    const handleSalvar = async () => {
        setTentouSalvar(true);

        if (nomeInvalido || precoInvalido || poucosProdutos || periodoInvalido) {
            return;
        }

        setSalvando(true);

        const salvou = await onSave({
            name: nome,
            description: descricao,
            price: precoNumero,
            status: combo?.status ?? "ACTIVE",
            startDate: fromDatetimeInput(dataInicio),
            endDate: fromDatetimeInput(dataFim),
            productIds,
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
                            {editando ? "Editar Combo" : "Criar Combo"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Cadastre o combo e configure os produtos que fazem
                            parte dele.
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

                    {/* INFORMAÇÕES GERAIS */}
                    <div className="mb-8">
                        <div className="mb-5">
                            <h3 className="pt-2 text-base font-semibold text-gray-800">
                                Informações gerais
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Configure as informações do combo.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 pt-3">
                            <div className="flex flex-col gap-6 sm:flex-row">
                                <TextField
                                    label="Nome do Combo"
                                    placeholder="Ex: Combo Família"
                                    value={nome}
                                    className="flex-1"
                                    onChange={(e) => setNome(e.target.value)}
                                    required
                                    error={tentouSalvar && nomeInvalido}
                                    helperText={
                                        tentouSalvar && nomeInvalido
                                            ? "Informe o nome do combo."
                                            : undefined
                                    }
                                />

                                <TextField
                                    label="Preço"
                                    type="number"
                                    placeholder="0,00"
                                    value={preco}
                                    className="flex-1"
                                    onChange={(e) => setPreco(e.target.value)}
                                    required
                                    error={tentouSalvar && precoInvalido}
                                    helperText={
                                        tentouSalvar && precoInvalido
                                            ? "Informe um preço maior que zero."
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
                            </div>

                            <TextField
                                label="Descrição"
                                placeholder="Ex: Combo com 3 pastéis para toda a família"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                fullWidth
                                multiline
                                minRows={3}
                            />
                        </div>
                    </div>

                    {/* PERÍODO */}
                    <div className="mb-8 border-t border-gray-200 pt-5">
                        <div className="mb-5">
                            <h3 className="text-base font-semibold text-gray-800">
                                Período
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                                Opcional. Sem datas, o combo fica disponível
                                sempre que estiver ativo.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 sm:flex-row">
                            <TextField
                                label="Data de início"
                                type="datetime-local"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                                fullWidth
                                slotProps={{ inputLabel: { shrink: true } }}
                            />

                            <TextField
                                label="Data de fim"
                                type="datetime-local"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                                fullWidth
                                error={tentouSalvar && periodoInvalido}
                                helperText={
                                    tentouSalvar && periodoInvalido
                                        ? "O fim precisa ser depois do início."
                                        : undefined
                                }
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </div>
                    </div>

                    {/* PRODUTOS */}
                    <div className="border-t border-gray-200 pt-5">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-800">
                                    Produtos
                                </h3>

                                <p className="mt-1 text-sm text-gray-500">
                                    Selecione os produtos que fazem parte do
                                    combo (mínimo de {MINIMO_PRODUTOS_COMBO}).
                                </p>
                            </div>

                            <Button
                                text="Gerenciar"
                                onClick={(event) =>
                                    setProdutosAnchorEl(event.currentTarget)
                                }
                                color={ButtonColor.Secondary}
                            />
                        </div>

                        <Menu
                            anchorEl={produtosAnchorEl}
                            open={Boolean(produtosAnchorEl)}
                            onClose={() => setProdutosAnchorEl(null)}
                            transitionDuration={0}
                            slotProps={{
                                paper: {
                                    sx: {
                                        width: 420,
                                        maxWidth: "calc(100vw - 32px)",
                                        maxHeight: 400,
                                    },
                                },
                            }}
                        >
                            {catalogoProdutos.length === 0 && (
                                <MenuItem disabled>
                                    {carregando
                                        ? "Carregando produtos..."
                                        : "Nenhum produto cadastrado."}
                                </MenuItem>
                            )}

                            {catalogoProdutos.map((produto) => (
                                <MenuItem
                                    key={produto.id}
                                    onClick={() => toggleProduto(produto.id)}
                                >
                                    <Checkbox
                                        checked={productIds.includes(produto.id)}
                                        size="small"
                                        disableRipple
                                        disableFocusRipple
                                        disableTouchRipple
                                    />

                                    <div className="mr-3 shrink-0">
                                        <Thumb src={produto.imageUrl} />
                                    </div>

                                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate text-sm text-gray-700">
                                                {produto.name}
                                            </span>

                                            <span className="text-xs text-gray-400">
                                                a partir de{" "}
                                                {formatCurrency(produto.precoMinimo)}
                                            </span>
                                        </div>

                                        {produto.status !== "ACTIVE" && (
                                            <Chip label="Inativo" size="small" />
                                        )}
                                    </div>
                                </MenuItem>
                            ))}
                        </Menu>

                        {carregando ? (
                            <div className="flex min-h-[210px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                                Carregando produtos...
                            </div>
                        ) : produtosSelecionados.length === 0 ? (
                            <div
                                className={`flex min-h-[210px] items-center justify-center rounded-md border border-dashed bg-gray-50 ${
                                    tentouSalvar && poucosProdutos
                                        ? "border-red-400"
                                        : "border-gray-300"
                                }`}
                            >
                                <div className="flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-medium text-gray-600">
                                        Nenhum produto selecionado
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        Clique em &quot;Gerenciar&quot; para
                                        selecionar os produtos do combo.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid max-h-[420px] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                                {produtosSelecionados.map((produto) => (
                                    <div
                                        key={produto.id}
                                        className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3"
                                    >
                                        <Thumb src={produto.imageUrl} />

                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <span className="truncate text-sm font-medium text-gray-800">
                                                {produto.name}
                                            </span>

                                            <span className="text-xs text-gray-500">
                                                a partir de{" "}
                                                {formatCurrency(produto.precoMinimo)}
                                            </span>

                                            <Chip
                                                label={
                                                    produto.status === "ACTIVE"
                                                        ? "Ativo"
                                                        : "Inativo"
                                                }
                                                size="small"
                                                sx={{ width: "fit-content" }}
                                            />
                                        </div>

                                        <IconButton
                                            size="small"
                                            disableRipple
                                            title="Remover produto"
                                            onClick={() =>
                                                toggleProduto(produto.id)
                                            }
                                            sx={{ color: "#666" }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </div>
                                ))}
                            </div>
                        )}

                        {tentouSalvar && poucosProdutos && (
                            <p className="mt-2 text-xs text-red-600">
                                Selecione pelo menos {MINIMO_PRODUTOS_COMBO}{" "}
                                produtos.
                            </p>
                        )}
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
                              : "Criar Combo"
                    }
                    color={ButtonColor.Green}
                    onClick={salvando || carregando ? () => undefined : handleSalvar}
                />
            </DialogActions>
        </>
    );
}
