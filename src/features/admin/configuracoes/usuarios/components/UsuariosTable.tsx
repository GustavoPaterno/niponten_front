"use client";

import EditIcon from "@mui/icons-material/Edit";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonOffIcon from "@mui/icons-material/PersonOff";

import StatusChip from "@/src/components/status/StatusChip";
import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "@/src/components/table/Datatable";
import { labelPermissao } from "@/src/services/cargos";
import {
    listarUsuariosInternos,
    UsuarioInterno,
} from "@/src/services/usuariosInternos";

interface UsuariosTableProps {
    reloadKey: number;
    onEditar: (usuario: UsuarioInterno) => void;
    onAlterarStatus: (usuario: UsuarioInterno) => void;
}

const columnDef: DataTableColumn<UsuarioInterno>[] = [
    {
        field: "nomeCompleto",
        type: "text",
        headerName: "Nome",
        render: (value) => value || "—",
    },
    {
        field: "email",
        type: "text",
        headerName: "E-mail",
        render: (value) => value || "—",
    },
    {
        field: "cargo",
        type: "text",
        headerName: "Cargo",
    },
    {
        field: "permissoesTexto",
        type: "text",
        headerName: "Permissões",
        render: (_value, row) =>
            row.permissions.length === 0 ? (
                "—"
            ) : (
                <div className="flex flex-wrap gap-1">
                    {row.permissions.map((permissao) => (
                        <StatusChip
                            key={permissao}
                            label={labelPermissao(permissao)}
                            tone="neutral"
                        />
                    ))}
                </div>
            ),
    },
    {
        field: "active",
        type: "text",
        headerName: "Status",
        render: (value) =>
            value ? (
                <StatusChip label="Ativo" tone="success" />
            ) : (
                <StatusChip label="Inativo" tone="warning" />
            ),
    },
];

export default function UsuariosTable({
    reloadKey,
    onEditar,
    onAlterarStatus,
}: UsuariosTableProps) {
    const actions: DataTableAction<UsuarioInterno>[] = [
        {
            icon: EditIcon,
            label: "Editar",
            onClick: onEditar,
            color: "#000000",
        },
        {
            icon: PersonOffIcon,
            label: "Desativar",
            onClick: onAlterarStatus,
            hidden: (usuario) => !usuario.active,
            color: "#EE2C2E",
        },
        {
            icon: HowToRegIcon,
            label: "Ativar",
            onClick: onAlterarStatus,
            hidden: (usuario) => usuario.active,
            color: "#16a34a",
        },
    ];

    return (
        <DataTable
            getMethod={listarUsuariosInternos}
            columnDef={columnDef}
            actions={actions}
            reloadKey={reloadKey}
            searchPlaceholder="Pesquisar usuários..."
            emptyMessage="Nenhum usuário interno cadastrado."
        />
    );
}
