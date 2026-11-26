"use client";

import { useState } from "react";
import StarsOutlined from "@mui/icons-material/StarsOutlined";

import StatusChip from "@/src/components/status/StatusChip";
import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "@/src/components/table/Datatable";
import { listarClientesComConta, type ClientePontos } from "@/src/services/pontos";

import PontosClienteDialog from "./PontosClienteDialog";

const columnDef: DataTableColumn<ClientePontos>[] = [
    {
        field: "email",
        type: "text",
        headerName: "E-mail",
        render: (value) => value || "—",
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

export default function ClientesPontos() {
    const [selecionado, setSelecionado] = useState<ClientePontos | null>(null);

    const actions: DataTableAction<ClientePontos>[] = [
        {
            icon: StarsOutlined,
            label: "Ver pontos",
            onClick: setSelecionado,
            color: "#1D1B19",
        },
    ];

    return (
        <>
            <DataTable
                getMethod={listarClientesComConta}
                columnDef={columnDef}
                actions={actions}
                searchPlaceholder="Pesquisar por e-mail..."
                emptyMessage="Nenhum cliente cadastrado."
            />

            <PontosClienteDialog cliente={selecionado} onClose={() => setSelecionado(null)} />
        </>
    );
}
