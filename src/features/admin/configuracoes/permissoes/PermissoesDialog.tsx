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

import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import Button, { ButtonColor } from "@/src/components/button/Button";

interface Permissoes {
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
    configuracoesSensiveis: boolean;
}

interface PermissoesDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;

    nome: string;
    descricao: string;
    permissoes: Permissoes;

    setNome: (value: string) => void;
    setDescricao: (value: string) => void;
    setPermissoes: React.Dispatch<React.SetStateAction<Permissoes>>;
}

export default function PermissoesDialog({
    open,
    onClose,
    onSave,
    nome,
    descricao,
    permissoes,
    setNome,
    setDescricao,
    setPermissoes,
}: PermissoesDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle>
                Novo cargo
            </DialogTitle>

            <DialogContent>
                <div className="flex flex-col gap-5 pt-2">

                    <TextField
                        label="Nome do cargo"
                        placeholder="Ex: Gerente"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Descrição"
                        placeholder="Descreva as responsabilidades deste cargo"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                    />

                    <Divider />

                    <div>

                        <div className="mb-1 text-base font-semibold text-gray-800">
                            Permissões administrativas
                        </div>

                        <div className="mb-3 text-sm text-gray-500">
                            Defina quais ações este cargo poderá realizar
                            nas configurações administrativas do sistema.
                        </div>

                        <div className="grid grid-cols-2">

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={permissoes.visualizar}
                                        onChange={(e) =>
                                            setPermissoes((prev) => ({
                                                ...prev,
                                                visualizar: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Visualizar"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={permissoes.criar}
                                        onChange={(e) =>
                                            setPermissoes((prev) => ({
                                                ...prev,
                                                criar: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Criar"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={permissoes.editar}
                                        onChange={(e) =>
                                            setPermissoes((prev) => ({
                                                ...prev,
                                                editar: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Editar"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={permissoes.excluir}
                                        onChange={(e) =>
                                            setPermissoes((prev) => ({
                                                ...prev,
                                                excluir: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label="Excluir"
                            />

                        </div>

                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <div className="flex gap-3">

                            <WarningAmberOutlined className="mt-0.5 text-amber-600" />

                            <div>

                                <div className="text-sm font-semibold text-gray-800">
                                    Configurações sensíveis
                                </div>

                                <div className="mt-1 text-xs leading-5 text-gray-600">
                                    Permite que este cargo altere configurações
                                    críticas do sistema, como cargos, permissões
                                    e outras configurações restritas ao administrador.
                                </div>

                            </div>

                        </div>

                        <FormControlLabel
                            className="mt-2"
                            control={
                                <Checkbox
                                    checked={permissoes.configuracoesSensiveis}
                                    onChange={(e) =>
                                        setPermissoes((prev) => ({
                                            ...prev,
                                            configuracoesSensiveis:
                                                e.target.checked,
                                        }))
                                    }
                                />
                            }
                            label="Permitir configurações sensíveis"
                        />

                    </div>

                </div>
            </DialogContent>

            <DialogActions className="px-6 pb-5">

                <Button
                    text="Cancelar"
                    onClick={onClose}
                    color={ButtonColor.Secondary} 
                />
                
                <Button
                    text="Confirmar"
                    color={ButtonColor.Green    } 
                    onClick={onSave}
                />
            </DialogActions>

        </Dialog>
    );
}