"use client";

import { useEffect, useState } from "react";
import {
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    TextField,
    useMediaQuery,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import Button, { ButtonColor } from "@/src/components/button/Button";
import LimitedTextField from "@/src/components/input/LimitedTextField";
import {
    listarCargos,
    PERMISSOES,
    type Cargo,
    type Permissao,
} from "@/src/services/cargos";
import type {
    NovoUsuarioInternoInput,
    UsuarioInterno,
} from "@/src/services/usuariosInternos";

interface UsuariosDialogProps {
    open: boolean;
    /** Usuário sendo editado. `null` = criando um novo. */
    usuario: UsuarioInterno | null;
    onClose: () => void;
    /** Devolve true quando salvou (o dialog é fechado por quem chama). */
    onSave: (input: NovoUsuarioInternoInput) => Promise<boolean>;
}

export default function UsuariosDialog({
    open,
    usuario,
    onClose,
    onSave,
}: UsuariosDialogProps) {
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
            <UsuariosForm usuario={usuario} onClose={onClose} onSave={onSave} />
        </Dialog>
    );
}

const SO_DIGITOS = /\D/g;

/** 12345678901 -> 123.456.789-01 (aplica até onde houver dígitos). */
function mascararCpf(valor: string): string {
    const d = valor.replace(SO_DIGITOS, "").slice(0, 11);

    return d
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UsuariosFormProps {
    usuario: UsuarioInterno | null;
    onClose: () => void;
    onSave: (input: NovoUsuarioInternoInput) => Promise<boolean>;
}

function UsuariosForm({ usuario, onClose, onSave }: UsuariosFormProps) {
    const editando = usuario !== null;

    const [nome, setNome] = useState(usuario?.name ?? "");
    const [sobrenome, setSobrenome] = useState(usuario?.lastName ?? "");
    const [email, setEmail] = useState(usuario?.email ?? "");
    const [senha, setSenha] = useState("");
    const [cpf, setCpf] = useState(mascararCpf(usuario?.cpf ?? ""));
    const [cargoId, setCargoId] = useState<number | "">(
        usuario?.internalRoleId ?? ""
    );
    const [permissoes, setPermissoes] = useState<Permissao[]>(
        usuario?.permissions ?? []
    );

    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [carregandoCargos, setCarregandoCargos] = useState(true);
    const [semAcessoCargos, setSemAcessoCargos] = useState(false);

    const [tentouSalvar, setTentouSalvar] = useState(false);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        let cancelado = false;

        listarCargos()
            .then((lista) => {
                if (cancelado) {
                    return;
                }

                setCargos(lista);

                const padrao = lista.find((cargo) => cargo.padrao && cargo.active);

                if (padrao) {
                    setCargoId((atual) => (atual === "" ? padrao.id : atual));
                }
            })
            .catch(() => {
                if (!cancelado) {
                    setSemAcessoCargos(true);
                }
            })
            .finally(() => {
                if (!cancelado) {
                    setCarregandoCargos(false);
                }
            });

        return () => {
            cancelado = true;
        };
    }, []);

    const cpfDigitos = cpf.replace(SO_DIGITOS, "");

    const nomeInvalido = nome.trim() === "";
    const sobrenomeInvalido = sobrenome.trim() === "";
    const emailInvalido = !editando && !EMAIL_VALIDO.test(email.trim());
    const senhaInvalida = !editando && senha.trim() === "";
    const cpfInvalido = cpfDigitos.length !== 11;
    const cargoInvalido = cargoId === "" && !semAcessoCargos;

    const togglePermissao = (permissao: Permissao) => {
        setPermissoes((atual) =>
            atual.includes(permissao)
                ? atual.filter((p) => p !== permissao)
                : [...atual, permissao]
        );
    };

    const cargosVisiveis = cargos.filter(
        (cargo) => cargo.active || cargo.id === usuario?.internalRoleId
    );

    const handleSalvar = async () => {
        setTentouSalvar(true);

        if (
            nomeInvalido ||
            sobrenomeInvalido ||
            emailInvalido ||
            senhaInvalida ||
            cpfInvalido ||
            cargoInvalido
        ) {
            return;
        }

        setSalvando(true);

        const salvou = await onSave({
            name: nome,
            lastName: sobrenome,
            email,
            password: senha,
            cpf: cpfDigitos,
            internalRoleId: cargoId === "" ? null : cargoId,
            permissions: PERMISSOES.map((p) => p.valor).filter((p) =>
                permissoes.includes(p)
            ),
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
                            {editando ? "Editar Usuário" : "Criar Usuário"}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {editando
                                ? "Altere os dados do usuário. E-mail e senha não mudam por aqui."
                                : "Preencha os dados de acesso e o perfil do novo usuário interno."}
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
                    <div className="flex flex-col gap-6 sm:flex-row sm:gap-4">
                        <LimitedTextField
                            label="Nome"
                            placeholder="Ex: Maria"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            fullWidth
                            required
                            error={tentouSalvar && nomeInvalido}
                            helperText={
                                tentouSalvar && nomeInvalido
                                    ? "Informe o nome."
                                    : undefined
                            }
                        />

                        <LimitedTextField
                            label="Sobrenome"
                            placeholder="Ex: Silva"
                            value={sobrenome}
                            onChange={(e) => setSobrenome(e.target.value)}
                            fullWidth
                            required
                            error={tentouSalvar && sobrenomeInvalido}
                            helperText={
                                tentouSalvar && sobrenomeInvalido
                                    ? "Informe o sobrenome."
                                    : undefined
                            }
                        />
                    </div>

                    <TextField
                        label="E-mail"
                        type="email"
                        placeholder="voce@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        fullWidth
                        required={!editando}
                        disabled={editando}
                        error={tentouSalvar && emailInvalido}
                        helperText={
                            tentouSalvar && emailInvalido
                                ? "Informe um e-mail válido."
                                : undefined
                        }
                    />

                    {!editando && (
                        <TextField
                            label="Senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            fullWidth
                            required
                            autoComplete="new-password"
                            error={tentouSalvar && senhaInvalida}
                            helperText={
                                tentouSalvar && senhaInvalida
                                    ? "Informe uma senha."
                                    : undefined
                            }
                        />
                    )}

                    <TextField
                        label="CPF"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => setCpf(mascararCpf(e.target.value))}
                        fullWidth
                        required
                        error={tentouSalvar && cpfInvalido}
                        helperText={
                            tentouSalvar && cpfInvalido
                                ? "Informe o CPF completo (11 dígitos)."
                                : undefined
                        }
                        slotProps={{ htmlInput: { inputMode: "numeric" } }}
                    />

                    {semAcessoCargos ? (
                        <TextField
                            label="Cargo"
                            value={editando ? usuario.cargo : "Cargo padrão"}
                            fullWidth
                            disabled
                            helperText={
                                editando
                                    ? "Você não tem permissão para ver cargos. O cargo atual será mantido."
                                    : "Você não tem permissão para ver cargos. Será usado o cargo padrão."
                            }
                        />
                    ) : (
                    <TextField
                        select
                        label="Cargo"
                        value={cargoId}
                        onChange={(e) =>
                            setCargoId(
                                e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                            )
                        }
                        fullWidth
                        required
                        error={tentouSalvar && cargoInvalido}
                        helperText={
                            carregandoCargos
                                ? "Carregando cargos..."
                                : tentouSalvar && cargoInvalido
                                  ? "Escolha um cargo."
                                  : undefined
                        }
                    >
                        {cargosVisiveis.length === 0 && (
                            <MenuItem value="" disabled>
                                {carregandoCargos
                                    ? "Carregando cargos..."
                                    : "Nenhum cargo cadastrado."}
                            </MenuItem>
                        )}

                        {cargosVisiveis.map((cargo) => (
                            <MenuItem key={cargo.id} value={cargo.id}>
                                {cargo.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    )}

                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            Permissões
                        </p>

                        <p className="text-xs text-gray-500">
                            Além das que o cargo já dá.
                        </p>

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
                              : "Criar Usuário"
                    }
                    color={ButtonColor.Green}
                    onClick={salvando ? () => undefined : handleSalvar}
                />
            </DialogActions>
        </>
    );
}
