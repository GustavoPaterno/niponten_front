"use client";

import { useState } from "react";
import {
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    useMediaQuery,
} from "@mui/material";
import { Close, InfoOutlined } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import LimitedTextField from "@/src/components/input/LimitedTextField";
import {
    PERMISSOES,
    type Cargo,
    type CargoInput,
    type Permissao,
} from "@/src/services/cargos";

interface PermissoesDialogProps {
    open: boolean;
    /** Cargo sendo editado. `null` = criando um novo. */
    cargo: Cargo | null;
    onClose: () => void;
    /** Devolve true quando salvou (o dialog é fechado por quem chama). */
    onSave: (input: CargoInput) => Promise<boolean>;
}

export default function PermissoesDialog({
    open,
    cargo,
    onClose,
    onSave,
}: PermissoesDialogProps) {
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
            <CargoForm cargo={cargo} onClose={onClose} onSave={onSave} />
        </Dialog>
    );
}

interface CargoFormProps {
    cargo: Cargo | null;
    onClose: () => void;
    onSave: (input: CargoInput) => Promise<boolean>;
}

function CargoForm({ cargo, onClose, onSave }: CargoFormProps) {
    const editando = cargo !== null;

    const [nome, setNome] = useState(cargo?.name ?? "");
    const [permissoes, setPermissoes] = useState<Permissao[]>([]);
    const [padrao, setPadrao] = useState(cargo?.padrao ?? false);

    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const nomeInvalido = nome.trim() === "";

    const togglePermissao = (permissao: Permissao) => {
        setPermissoes((atual) =>
            atual.includes(permissao)
                ? atual.filter((p) => p !== permissao)
                : [...atual, permissao]
        );
    };

    const handleSalvar = async () => {
        setTentouSalvar(true);

        if (nomeInvalido) {
            return;
        }

        setSalvando(true);

        const salvou = await onSave({ name: nome, permissions: permissoes, padrao });

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
                            {editando ? "Editar Cargo" : "Criar Cargo"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {editando
                                ? "Altere o nome e as permissões do cargo."
                                : "Dê um nome ao cargo e escolha o que ele pode gerenciar."}
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
                    <LimitedTextField
                        label="Nome do cargo"
                        placeholder="Ex: Gerente"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        fullWidth
                        required
                        error={tentouSalvar && nomeInvalido}
                        helperText={
                            tentouSalvar && nomeInvalido
                                ? "Informe o nome do cargo."
                                : undefined
                        }
                    />

                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            Permissões
                        </p>

                        <p className="text-xs text-gray-500">
                            O que quem tem este cargo pode gerenciar no painel.
                        </p>

                        {editando && (
                            <div className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-gray-700">
                                <InfoOutlined
                                    fontSize="small"
                                    className="text-amber-600"
                                />

                                <span>
                                    As permissões atuais deste cargo não podem ser
                                    carregadas. Ao salvar, elas serão{" "}
                                    <strong>substituídas</strong> pelas que estiverem
                                    marcadas abaixo.
                                </span>
                            </div>
                        )}

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2">
                            {PERMISSOES.map((permissao) => (
                                <FormControlLabel
                                    key={permissao.valor}
                                    label={permissao.label}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={permissoes.includes(
                                                permissao.valor
                                            )}
                                            onChange={() =>
                                                togglePermissao(permissao.valor)
                                            }
                                        />
                                    }
                                />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-3">
                        <FormControlLabel
                            label="Cargo padrão"
                            control={
                                <Checkbox
                                    size="small"
                                    checked={padrao}
                                    onChange={(e) => setPadrao(e.target.checked)}
                                />
                            }
                        />

                        <p className="ml-8 text-xs text-gray-500">
                            Vem selecionado ao criar um novo usuário interno.
                        </p>
                    </div>
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
                              : "Criar Cargo"
                    }
                    color={ButtonColor.Green}
                    onClick={salvando ? () => undefined : handleSalvar}
                />
            </DialogActions>
        </>
    );
}
