"use client";

import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";

import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "./Datatable";
import { PermissaoColumnDef } from "@/src/features/admin/configuracoes/permissoes/components/PermissoesColumnDef";
import { Add, Delete, Visibility, WarningAmber } from "@mui/icons-material";

interface Cargo {
    id: number;
    imagem?: string;
    nome: string;
    descricao: string;
    ativo: boolean;

    permissoes: {
        visualizar: boolean;
        criar: boolean;
        editar: boolean;
        excluir: boolean;
        configuracoesSensiveis: boolean;
    };
}

const cargosMock: Cargo[] = [
    {
        id: 1,
        nome: "Administrador",
        descricao: "Acesso completo ao sistema",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: true,
            configuracoesSensiveis: true,
        },
    },
    {
        id: 2,
        nome: "Gerente",
        descricao: "Gerenciamento geral da loja",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 3,
        nome: "Vendedor",
        descricao: "Acesso às vendas",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: false,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 4,
        nome: "Caixa",
        descricao: "Operações de caixa",
        ativo: false,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: false,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 5,
        nome: "Estoquista",
        descricao: "Gerenciamento do estoque",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 6,
        nome: "Supervisor",
        descricao: "Supervisão dos funcionários",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 7,
        nome: "Atendente",
        descricao: "Atendimento ao cliente",
        ativo: false,
        permissoes: {
            visualizar: true,
            criar: false,
            editar: false,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 8,
        nome: "Financeiro",
        descricao: "Gerenciamento financeiro",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: true,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 9,
        nome: "Recursos Humanos",
        descricao: "Gerenciamento de funcionários",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: true,
            editar: true,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 10,
        nome: "Suporte",
        descricao: "Suporte técnico",
        ativo: false,
        permissoes: {
            visualizar: true,
            criar: false,
            editar: false,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
    {
        id: 11,
        nome: "Auditor",
        descricao: "Consulta e auditoria",
        ativo: true,
        permissoes: {
            visualizar: true,
            criar: false,
            editar: false,
            excluir: false,
            configuracoesSensiveis: false,
        },
    },
];

const getCargos = async (): Promise<Cargo[]> => {
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    return cargosMock;
};

const columnDef: DataTableColumn<Cargo>[] = [
    {
        field: "imagem",
        headerName: "Imagem",
        render: (value) => (
            value !== undefined ? (
                <Image
                    src={String(value)}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                />
            ) : (
                <Image
                    src="/images/marusan-logo.jpg"
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                />
            )
        ),
    },
    {
        field: "nome",
        type: "text",
        headerName: "Cargo",
    },
    {
        field: "descricao",
        type: "text",
        headerName: "Descrição",
    },
    {
        field: "permissoes",
        headerName: "Permissões",
        render: (value) => (
            <div className="flex items-center gap-1.5">

                <PermissaoColumnDef permitido={value.visualizar}>
                    <Visibility sx={{ fontSize: 16 }} />
                </PermissaoColumnDef>

                <PermissaoColumnDef permitido={value.criar}>
                    <Add sx={{ fontSize: 16 }} />
                </PermissaoColumnDef>

                <PermissaoColumnDef permitido={value.editar}>
                    <EditIcon sx={{ fontSize: 16 }} />
                </PermissaoColumnDef>

                <PermissaoColumnDef permitido={value.excluir}>
                    <Delete sx={{ fontSize: 16 }} />
                </PermissaoColumnDef>

                {/* <PermissaoColumnDef permitido={value.configuracoesSensiveis}>
                    <WarningAmber sx={{ fontSize: 16 }} />
                </PermissaoColumnDef> */}

            </div>
        ),
    },
    {
        field: "ativo",
        type: "text",
        headerName: "Status",
        render: (value) => (
            <span
                className={
                    value
                        ? "font-medium text-green-600"
                        : "font-medium text-red-400"
                }
            >
                {value ? "Ativo" : "Inativo"}
            </span>
        ),
    },
];

const actions: DataTableAction<Cargo>[] = [
    {
        icon: EditIcon,
        label: "Editar",
        onClick: (cargo) => {
            console.log("Editar cargo:", cargo);
        },
        color: "#000000",
    },
    {
        icon: PauseIcon,
        label: "Desativar",
        onClick: (cargo) => {
            console.log("Desativar cargo:", cargo);
        },
        color: "#000000",
    },
];

export default function DatatableMocked() {
    return (
        <DataTable
            getMethod={getCargos}
            columnDef={columnDef}
            actions={actions}
        />
    );
}