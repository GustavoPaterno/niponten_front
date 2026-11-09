"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ArrowBack, VisibilityOutlined } from "@mui/icons-material";

import {
    DataTable,
    type DataTableAction,
    type DataTableColumn,
} from "@/src/components/table/Datatable";
import { formatCurrency } from "@/src/lib/format";
import {
    NOME_PAGAMENTO,
    NOME_TIPO,
    listarHistorico,
    type Pedido,
} from "@/src/services/pedidos";

import DetalhePedido, { SeloStatus } from "./components/DetalhePedido";
import { VERMELHO } from "./estilosMui";

type Filtro = "todos" | "COMPLETED" | "CANCELLED";

const FILTROS: { valor: Filtro; label: string }[] = [
    { valor: "todos", label: "Todos" },
    { valor: "COMPLETED", label: "Concluídos" },
    { valor: "CANCELLED", label: "Cancelados" },
];

// Linha da tabela: campos já formatados para a busca e a ordenação da DataTable funcionarem.
interface LinhaHistorico extends Pedido {
    data: string;
    tipoTexto: string;
    pagamentoTexto: string;
}

function toLinha(p: Pedido): LinhaHistorico {
    return {
        ...p,
        data: new Date(p.criadoEm).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }),
        tipoTexto: NOME_TIPO[p.tipo],
        pagamentoTexto: `${p.pagamento ? NOME_PAGAMENTO[p.pagamento] : "—"} · ${p.pago ? "pago" : "não pago"}`,
    };
}

const colunas: DataTableColumn<LinhaHistorico>[] = [
    {
        field: "codigo",
        headerName: "Pedido",
        render: (valor) => <span className="font-mono font-semibold">#{valor}</span>,
    },
    { field: "data", headerName: "Data" },
    { field: "cliente", headerName: "Cliente" },
    { field: "tipoTexto", headerName: "Tipo" },
    { field: "pagamentoTexto", headerName: "Pagamento" },
    {
        field: "total",
        headerName: "Total",
        render: (valor) => <span className="tabular-nums">{formatCurrency(valor)}</span>,
    },
    {
        field: "status",
        headerName: "Status",
        render: (valor) => <SeloStatus status={valor} />,
    },
];

export default function HistoricoPedidos() {
    const [filtro, setFiltro] = useState<Filtro>("todos");
    const [aberto, setAberto] = useState<number | null>(null);

    // Trocar o filtro troca a função, e a DataTable recarrega sozinha.
    const buscar = useCallback(async () => {
        const lista = await listarHistorico();

        return lista.filter((p) => filtro === "todos" || p.status === filtro).map(toLinha);
    }, [filtro]);

    const acoes: DataTableAction<LinhaHistorico>[] = [
        {
            icon: VisibilityOutlined,
            label: "Ver detalhes",
            onClick: (linha) => setAberto(linha.id),
            color: "#000000",
        },
    ];

    return (
        <div className="flex flex-col gap-4 p-2 text-neutral-900 sm:gap-5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <Link
                        href="/admin"
                        className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900"
                    >
                        <ArrowBack sx={{ fontSize: 16 }} />
                        Pedidos ativos
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Histórico de pedidos</h1>
                    <p className="text-sm text-neutral-500">Pedidos concluídos e cancelados</p>
                </div>

                <ToggleButtonGroup
                    value={filtro}
                    exclusive
                    // Clicar no filtro já marcado devolve null: mantém o atual.
                    onChange={(_, valor: Filtro | null) => valor && setFiltro(valor)}
                    aria-label="Filtrar por status"
                    size="small"
                    sx={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        "& .MuiToggleButton-root": {
                            px: 2,
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: 13,
                            color: "rgba(0,0,0,0.55)",
                            borderColor: "rgba(0,0,0,0.12)",
                        },
                        "& .MuiToggleButton-root:first-of-type": { borderRadius: "12px 0 0 12px" },
                        "& .MuiToggleButton-root:last-of-type": { borderRadius: "0 12px 12px 0" },
                        "& .MuiToggleButton-root.Mui-selected": {
                            backgroundColor: "rgba(238,44,46,0.08)",
                            color: VERMELHO,
                        },
                        "& .MuiToggleButton-root.Mui-selected:hover": {
                            backgroundColor: "rgba(238,44,46,0.12)",
                        },
                    }}
                >
                    {FILTROS.map((f) => (
                        <ToggleButton key={f.valor} value={f.valor}>
                            {f.label}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>

            <DataTable
                getMethod={buscar}
                columnDef={colunas}
                actions={acoes}
                searchPlaceholder="Buscar código ou nome"
                emptyMessage="Nenhum pedido no histórico."
            />

            <DetalhePedido id={aberto} onFechar={() => setAberto(null)} somenteLeitura />
        </div>
    );
}
