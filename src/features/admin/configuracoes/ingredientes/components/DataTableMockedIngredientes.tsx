"use client";

import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";

import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "../../../../../components/table/Datatable";
import { PermissaoColumnDef } from "@/src/features/admin/configuracoes/permissoes/components/PermissoesColumnDef";
import { Add, Delete, Visibility, WarningAmber } from "@mui/icons-material";

interface Ingrediente {
    id: number;
    imagem?: string;
    nome: string;
    quantidade: string
    estoque: boolean;
}

const ingredientesMock: Ingrediente[] = [
    {
        id: 1,
        nome: "Queijo",
        quantidade: "2",
        estoque: true,
    },
    {
        id: 2,
        nome: "Massa",
        quantidade: "15",
        estoque: true,
    },
    {
        id: 3,
        nome: "Chocolate",
        quantidade: "30",
        estoque: true,
       
    },
    {
        id: 4,
        nome: "Chocolate Branco",
        quantidade: "0",
        estoque: false,
    },
    {
        id: 5,
        nome: "Catupiri",
        quantidade: "500",
        estoque: true,
    },
    {
        id: 6,
        nome: "Carne Bovina",
        quantidade: "100",
        estoque: true,
    },
    {
        id: 7,
        nome: "Bacon",
        quantidade: "0",
        estoque: false,
    },
    {
        id: 8,
        nome: "Queijo Muzzarela",
        quantidade: "20",
        estoque: true,
    }
];

const getIngredientes = async (): Promise<Ingrediente[]> => {
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    return ingredientesMock;
};

const columnDef: DataTableColumn<Ingrediente>[] = [
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
        headerName: "Ingrediente",
    },
    {
        field: "quantidade",
        type: "text",
        headerName: "quantidade",
    },
    {
        field: "estoque",
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
                {value ? "Estoque" : "Fora"}
            </span>
        ),
    },
];

const actions: DataTableAction<Ingrediente>[] = [
    {
        icon: EditIcon,
        label: "Editar",
        onClick: (ingrediente) => {
            console.log("Editar ingrediente:", ingrediente);
        },
        color: "#000000",
    },
    {
        icon: PauseIcon,
        label: "Desativar",
        onClick: (ingrediente) => {
            console.log("Desativar ingrediente:", ingrediente);
        },
        color: "#000000",
    },
];

export default function DatatableMockedIngredientes() {
    return (
        <DataTable
            getMethod={getIngredientes}
            columnDef={columnDef}
            actions={actions}
        />
    );
}