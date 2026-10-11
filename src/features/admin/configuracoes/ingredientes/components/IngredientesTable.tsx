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
import { formatCurrency } from "@/src/lib/format";
import {
    Ingrediente,
    listarIngredientes,
} from "@/src/services/ingredientes";

interface IngredientesTableProps {
    reloadKey: number;
    onEditar: (ingrediente: Ingrediente) => void;
    onAlterarStatus: (ingrediente: Ingrediente) => void;
    onExcluir: (ingrediente: Ingrediente) => void;
}

const columnDef: DataTableColumn<Ingrediente>[] = [
    {
        field: "imageUrl",
        headerName: "Imagem",
        render: (value) => <Thumb src={value} />,
    },
    {
        field: "name",
        type: "text",
        headerName: "Ingrediente",
    },
    {
        field: "description",
        type: "text",
        headerName: "Descrição",
        render: (value) => value || "—",
    },
    {
        field: "price",
        type: "text",
        headerName: "Preço",
        render: (value) => formatCurrency(value),
    },
    {
        field: "status",
        type: "text",
        headerName: "Status",
        render: (value) =>
            value === "ACTIVE" ? (
                <StatusChip label="Disponível" tone="success" />
            ) : (
                <StatusChip label="Esgotado" tone="warning" />
            ),
    },
];

export default function IngredientesTable({
    reloadKey,
    onEditar,
    onAlterarStatus,
    onExcluir,
}: IngredientesTableProps) {
    const actions: DataTableAction<Ingrediente>[] = [
        {
            icon: EditIcon,
            label: "Editar",
            onClick: onEditar,
            color: "#000000",
        },
        {
            icon: PauseIcon,
            label: "Marcar como esgotado",
            onClick: onAlterarStatus,
            hidden: (ingrediente) => ingrediente.status !== "ACTIVE",
            color: "#000000",
        },
        {
            icon: PlayArrowIcon,
            label: "Marcar como disponível",
            onClick: onAlterarStatus,
            hidden: (ingrediente) => ingrediente.status === "ACTIVE",
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
            getMethod={listarIngredientes}
            columnDef={columnDef}
            actions={actions}
            reloadKey={reloadKey}
            mobileCards
            searchPlaceholder="Pesquisar ingredientes..."
            emptyMessage="Nenhum ingrediente cadastrado."
        />
    );
}
