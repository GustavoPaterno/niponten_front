"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { DataTable, DataTableAction, DataTableColumn } from "@/src/components/table/Datatable";
import { listarCategoriasComProdutos, type CategoriaComProdutos } from "@/src/services/categorias";

interface CategoriasTableProps {
    reloadKey: number;
    onEditar: (categoria: CategoriaComProdutos) => void;
    onExcluir: (categoria: CategoriaComProdutos) => void;
}

const columnDef: DataTableColumn<CategoriaComProdutos>[] = [
    {
        field: "ordem",
        type: "text",
        headerName: "Ordem",
    },
    {
        field: "name",
        type: "text",
        headerName: "Categoria",
    },
    {
        field: "produtos",
        type: "text",
        headerName: "Produtos",
        render: (value) => (value === 1 ? "1 produto" : `${value} produtos`),
    },
];

export default function CategoriasTable({ reloadKey, onEditar, onExcluir }: CategoriasTableProps) {
    const actions: DataTableAction<CategoriaComProdutos>[] = [
        {
            icon: EditIcon,
            label: "Editar",
            onClick: onEditar,
            color: "#1D1B19",
        },
        {
            icon: DeleteIcon,
            label: "Excluir",
            onClick: onExcluir,
            color: "var(--erro)",
        },
    ];

    return (
        <DataTable
            getMethod={listarCategoriasComProdutos}
            columnDef={columnDef}
            actions={actions}
            reloadKey={reloadKey}
            searchPlaceholder="Pesquisar categorias..."
            emptyMessage="Nenhuma categoria cadastrada. Crie a primeira, como Pastéis ou Sucos."
        />
    );
}
