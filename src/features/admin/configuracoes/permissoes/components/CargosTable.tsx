"use client";

import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import StatusChip from "@/src/components/status/StatusChip";
import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "@/src/components/table/Datatable";
import { Cargo, listarCargos } from "@/src/services/cargos";

interface CargosTableProps {
    reloadKey: number;
    onEditar: (cargo: Cargo) => void;
    onAlterarStatus: (cargo: Cargo) => void;
}

const columnDef: DataTableColumn<Cargo>[] = [
    {
        field: "label",
        type: "text",
        headerName: "Cargo",
        render: (value, row) => (
            <div className="flex flex-wrap items-center gap-2">
                <span>{value}</span>

                {row.reservado && <StatusChip label="Sistema" tone="neutral" />}

                {row.padrao && <StatusChip label="Padrão" tone="neutral" />}
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

export default function CargosTable({
    reloadKey,
    onEditar,
    onAlterarStatus,
}: CargosTableProps) {
    // Cargos do sistema (ex.: super_admin) não podem ser editados nem desativados.
    const actions: DataTableAction<Cargo>[] = [
        {
            icon: EditIcon,
            label: "Editar",
            onClick: onEditar,
            hidden: (cargo) => cargo.reservado,
            color: "#000000",
        },
        {
            icon: PauseIcon,
            label: "Desativar",
            onClick: onAlterarStatus,
            hidden: (cargo) => cargo.reservado || !cargo.active,
            color: "#000000",
        },
        {
            icon: PlayArrowIcon,
            label: "Ativar",
            onClick: onAlterarStatus,
            hidden: (cargo) => cargo.reservado || cargo.active,
            color: "#000000",
        },
    ];

    return (
        <DataTable
            getMethod={listarCargos}
            columnDef={columnDef}
            actions={actions}
            reloadKey={reloadKey}
            searchPlaceholder="Pesquisar cargos..."
            emptyMessage="Nenhum cargo cadastrado."
        />
    );
}
