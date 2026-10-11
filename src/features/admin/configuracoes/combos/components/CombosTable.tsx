"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import Thumb from "@/src/components/image/Thumb";
import StatusChip from "@/src/components/status/StatusChip";
import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "@/src/components/table/Datatable";
import { formatCurrency, formatDate } from "@/src/lib/format";
import { Combo, listarCombos } from "@/src/services/combos";

interface CombosTableProps {
    reloadKey: number;
    onEditar: (combo: Combo) => void;
    onAlterarStatus: (combo: Combo) => void;
    onExcluir: (combo: Combo) => void;
}

const columnDef: DataTableColumn<Combo>[] = [
    {
        field: "imageUrl",
        headerName: "Imagem",
        render: (value) => <Thumb src={value} />,
    },
    {
        field: "name",
        type: "text",
        headerName: "Combo",
    },
    {
        field: "description",
        type: "text",
        headerName: "Descrição",
        render: (value) => value || "—",
    },
    {
        field: "produtosTexto",
        type: "text",
        headerName: "Produtos",
        render: (value) => value || "—",
    },
    {
        field: "price",
        type: "text",
        headerName: "Preço",
        render: (value) => formatCurrency(value),
    },
    {
        field: "startDate",
        type: "text",
        headerName: "Início",
        render: (value) => formatDate(value),
    },
    {
        field: "endDate",
        type: "text",
        headerName: "Fim",
        render: (value) => formatDate(value),
    },
    {
        field: "status",
        type: "text",
        headerName: "Status",
        render: (value) =>
            value === "ACTIVE" ? (
                <StatusChip label="Ativo" tone="success" />
            ) : (
                <StatusChip label="Inativo" tone="neutral" />
            ),
    },
];

export default function CombosTable({
    reloadKey,
    onEditar,
    onAlterarStatus,
    onExcluir,
}: CombosTableProps) {
    const actions: DataTableAction<Combo>[] = [
        {
            icon: EditIcon,
            label: "Editar",
            onClick: onEditar,
            color: "#000000",
        },
        {
            icon: PauseIcon,
            label: "Inativar",
            onClick: onAlterarStatus,
            hidden: (combo) => combo.status !== "ACTIVE",
            color: "#000000",
        },
        {
            icon: PlayArrowIcon,
            label: "Ativar",
            onClick: onAlterarStatus,
            hidden: (combo) => combo.status === "ACTIVE",
            color: "#000000",
        },
        {
            icon: DeleteIcon,
            label: "Excluir",
            onClick: onExcluir,
            color: "#EE2C2E",
        },
    ];

    return (
        <DataTable
            getMethod={listarCombos}
            columnDef={columnDef}
            actions={actions}
            reloadKey={reloadKey}
            mobileCards
            searchPlaceholder="Pesquisar combos..."
            emptyMessage="Nenhum combo cadastrado."
        />
    );
}
