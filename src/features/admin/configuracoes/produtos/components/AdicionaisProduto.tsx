"use client";

import { useState } from "react";
import {
    Checkbox,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import Thumb from "@/src/components/image/Thumb";
import TruncatedText from "@/src/components/text/TruncatedText";
import { formatCurrency } from "@/src/lib/format";
import type { Ingrediente } from "@/src/services/ingredientes";
import type { ProdutoStatus } from "@/src/services/produtos";

/** Adicional no formulário: o máximo fica como texto enquanto a pessoa digita. */
export interface AdicionalForm {
    ingredientId: number;
    maximo: string;
    status: ProdutoStatus;
}

export const MAXIMO_PADRAO = "3";

export function maximoInvalido(maximo: string): boolean {
    const numero = Number(maximo);

    return !Number.isInteger(numero) || numero < 1 || numero > 99;
}

interface AdicionaisProdutoProps {
    catalogo: Ingrediente[];
    carregando: boolean;
    adicionais: AdicionalForm[];
    onChange: (adicionais: AdicionalForm[]) => void;
    tentouSalvar: boolean;
}

/**
 * Ingredientes que o cliente pode acrescentar ao produto, cada um com um limite de unidades.
 * O preço de cada adicional é o do ingrediente (definido na tela de Ingredientes).
 */
export default function AdicionaisProduto({
    catalogo,
    carregando,
    adicionais,
    onChange,
    tentouSalvar,
}: AdicionaisProdutoProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const selecionado = (id: number) => adicionais.some((a) => a.ingredientId === id);

    const alternar = (id: number) =>
        onChange(
            selecionado(id)
                ? adicionais.filter((a) => a.ingredientId !== id)
                : [...adicionais, { ingredientId: id, maximo: MAXIMO_PADRAO, status: "ACTIVE" }]
        );

    const atualizar = (id: number, dados: Partial<AdicionalForm>) =>
        onChange(adicionais.map((a) => (a.ingredientId === id ? { ...a, ...dados } : a)));

    const linhas = adicionais
        .map((a) => ({ form: a, ingrediente: catalogo.find((i) => i.id === a.ingredientId) }))
        .filter(
            (l): l is { form: AdicionalForm; ingrediente: Ingrediente } => l.ingrediente !== undefined
        );

    return (
        <div className="min-w-0">
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-display text-base font-bold text-tinta">Adicionais</h3>

                    <p className="mt-1 text-sm text-tinta-suave">
                        Ingredientes que o cliente pode acrescentar, com o limite de cada um. O
                        preço é o do ingrediente.
                    </p>
                </div>

                <Button
                    text="Gerenciar"
                    onClick={(event) => setAnchorEl(event.currentTarget)}
                    color={ButtonColor.Secondary}
                />
            </div>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transitionDuration={0}
                slotProps={{
                    paper: { sx: { width: 380, maxWidth: "calc(100vw - 32px)", maxHeight: 350 } },
                }}
            >
                {catalogo.length === 0 && (
                    <MenuItem disabled>
                        {carregando ? "Carregando ingredientes..." : "Nenhum ingrediente cadastrado."}
                    </MenuItem>
                )}

                {catalogo.map((ingrediente) => (
                    <MenuItem key={ingrediente.id} onClick={() => alternar(ingrediente.id)}>
                        <Checkbox
                            checked={selecionado(ingrediente.id)}
                            size="small"
                            disableRipple
                            disableFocusRipple
                            disableTouchRipple
                        />

                        <div className="mr-3">
                            <Thumb src={ingrediente.imageUrl} />
                        </div>

                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                            <TruncatedText maxWidth={200} className="text-sm text-tinta">
                                {ingrediente.name}
                            </TruncatedText>

                            <span className="shrink-0 text-xs text-tinta-suave">
                                + {formatCurrency(ingrediente.price)}
                            </span>
                        </div>
                    </MenuItem>
                ))}
            </Menu>

            {carregando ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-black/20 bg-chapa text-sm text-tinta-suave">
                    Carregando ingredientes...
                </div>
            ) : linhas.length === 0 ? (
                <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-black/20 bg-chapa px-4">
                    <div className="text-center">
                        <p className="text-sm font-medium text-tinta-suave">Nenhum adicional liberado</p>

                        <p className="mt-1 text-xs text-tinta-suave/70">
                            Sem adicionais, a seção não aparece para o cliente. Use
                            &quot;Gerenciar&quot; para liberar.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {linhas.map(({ form, ingrediente }) => {
                        const invalido = tentouSalvar && maximoInvalido(form.maximo);

                        return (
                            <div
                                key={form.ingredientId}
                                className="flex flex-wrap items-center gap-3 rounded-md border border-black/10 bg-white p-3"
                            >
                                <Thumb src={ingrediente.imageUrl} />

                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <TruncatedText className="text-sm font-medium text-tinta">
                                        {ingrediente.name}
                                    </TruncatedText>

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-tinta-suave">
                                            + {formatCurrency(ingrediente.price)}
                                        </span>

                                        {ingrediente.status !== "ACTIVE" && (
                                            <Chip label="Esgotado" size="small" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <TextField
                                        label="Máx."
                                        type="number"
                                        value={form.maximo}
                                        onChange={(e) =>
                                            atualizar(form.ingredientId, { maximo: e.target.value })
                                        }
                                        size="small"
                                        error={invalido}
                                        helperText={invalido ? "1 a 99" : undefined}
                                        sx={{ width: 80 }}
                                        slotProps={{ htmlInput: { min: 1, max: 99, step: 1 } }}
                                    />

                                    <TextField
                                        select
                                        label="Status"
                                        value={form.status}
                                        onChange={(e) =>
                                            atualizar(form.ingredientId, {
                                                status: e.target.value as ProdutoStatus,
                                            })
                                        }
                                        size="small"
                                        sx={{ width: 112 }}
                                    >
                                        <MenuItem value="ACTIVE">Ativo</MenuItem>
                                        <MenuItem value="INACTIVE">Inativo</MenuItem>
                                    </TextField>

                                    <IconButton
                                        size="small"
                                        disableRipple
                                        title="Remover adicional"
                                        aria-label={`Remover adicional ${ingrediente.name}`}
                                        onClick={() => alternar(form.ingredientId)}
                                        sx={{ color: "#666", mt: 0.5 }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
