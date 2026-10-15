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
import { listarProdutos, Produto } from "@/src/services/produtos";

interface ProdutosTableProps {
    reloadKey: number;
    onEditar: (produto: Produto) => void;
    onAlterarStatus: (produto: Produto) => void;
    onExcluir: (produto: Produto) => void;
}

const columnDef: DataTableColumn<Produto>[] = [
    {
        field: "imageUrl",
        headerName: "Imagem",
        render: (value) => <Thumb src={value} />,
    },
    {
        field: "name",
        type: "text",
        headerName: "Produto",
    },
    {
        field: "description",
        type: "text",
        headerName: "Descrição",
        render: (value) => value || "—",
    },
    {
        field: "ingredientesTexto",
        type: "text",
        headerName: "Ingredientes",
        render: (value) => value || "—",
    },
    {
        field: "tamanhosTexto",
        type: "text",
        headerName: "Tamanhos",
        render: (value) => value || "—",
    },
    {
        field: "precoMinimo",
        type: "text",
        headerName: "Preço mínimo",
        render: (value) => formatCurrency(value),
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

export default function ProdutosTable({
    reloadKey,
    onEditar,
    onAlterarStatus,
    onExcluir,
}: ProdutosTableProps) {
    const actions: DataTableAction<Produto>[] = [
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
            hidden: (produto) => produto.status !== "ACTIVE",
            color: "#000000",
        },
        {
            icon: PlayArrowIcon,
            label: "Ativar",
            onClick: onAlterarStatus,
            hidden: (produto) => produto.status === "ACTIVE",
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
            getMethod={listarProdutos}
            columnDef={columnDef}
            actions={actions}
            reloadKey={reloadKey}
            searchPlaceholder="Pesquisar produtos..."
            emptyMessage="Nenhum produto cadastrado."
        />
    );
}
