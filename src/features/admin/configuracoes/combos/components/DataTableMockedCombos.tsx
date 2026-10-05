"use client";

import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";

import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "../../../../../components/table/Datatable";

interface ComboProduto {
    id: number;
    name: string;
}

interface Combo {
    id: number;
    name: string;
    imageUrl: string;
    description: string;
    price: number;
    status: "ACTIVE" | "INACTIVE";
    startDate: string;
    endDate: string;
    products: ComboProduto[];
}

const combosMock: Combo[] = [
    {
        id: 1,
        name: "Combo Família",
        description:
            "Combo perfeito para compartilhar com toda a família",
        imageUrl: "/images/marusan-logo.jpg",
        price: 39.9,
        status: "ACTIVE",
        startDate: "2026-10-01T00:00:00",
        endDate: "2026-12-31T23:59:59",
        products: [
            {
                id: 1,
                name: "Pastel de Carne",
            },
            {
                id: 2,
                name: "Pastel de Queijo",
            },
            {
                id: 6,
                name: "Pastel de Chocolate",
            },
        ],
    },
    {
        id: 2,
        name: "Combo Casal",
        description:
            "Dois pastéis e uma opção doce para compartilhar",
        imageUrl: "/images/marusan-logo.jpg",
        price: 29.9,
        status: "ACTIVE",
        startDate: "2026-10-01T00:00:00",
        endDate: "2026-11-30T23:59:59",
        products: [
            {
                id: 1,
                name: "Pastel de Carne",
            },
            {
                id: 3,
                name: "Pastel de Carne com Queijo",
            },
            {
                id: 7,
                name: "Pastel de Chocolate Branco",
            },
        ],
    },
    {
        id: 3,
        name: "Combo Tradicional",
        description:
            "Seleção dos pastéis mais tradicionais da casa",
        imageUrl: "/images/marusan-logo.jpg",
        price: 34.9,
        status: "ACTIVE",
        startDate: "2026-10-05T00:00:00",
        endDate: "2026-12-31T23:59:59",
        products: [
            {
                id: 1,
                name: "Pastel de Carne",
            },
            {
                id: 2,
                name: "Pastel de Queijo",
            },
            {
                id: 4,
                name: "Pastel de Bacon com Queijo",
            },
        ],
    },
    {
        id: 4,
        name: "Combo Especial",
        description:
            "Combinação especial de sabores salgados",
        imageUrl: "/images/marusan-logo.jpg",
        price: 42.9,
        status: "INACTIVE",
        startDate: "2026-09-01T00:00:00",
        endDate: "2026-09-30T23:59:59",
        products: [
            {
                id: 3,
                name: "Pastel de Carne com Queijo",
            },
            {
                id: 4,
                name: "Pastel de Bacon com Queijo",
            },
            {
                id: 5,
                name: "Pastel de Frango com Catupiri",
            },
        ],
    },
];

const getCombos = async (): Promise<Combo[]> => {
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    return combosMock;
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
};

const columnDef: DataTableColumn<Combo>[] = [
    {
        field: "imageUrl",
        headerName: "Imagem",
        render: (value) => (
            <Image
                src={value || "/images/marusan-logo.jpg"}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
            />
        ),
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
    },
    {
        field: "products",
        type: "text",
        headerName: "Produtos",
        render: (value) =>
            value
                .map(
                    (product: ComboProduto) =>
                        product.name
                )
                .join(", "),
    },
    {
        field: "price",
        type: "text",
        headerName: "Preço",
        render: (value) =>
            `R$ ${value.toFixed(2).replace(".", ",")}`,
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
        render: (value) => (
            <span
                className={
                    value === "ACTIVE"
                        ? "font-medium text-green-600"
                        : "font-medium text-gray-500"
                }
            >
                {value === "ACTIVE"
                    ? "Ativo"
                    : "Inativo"}
            </span>
        ),
    },
];

const actions: DataTableAction<Combo>[] = [
    {
        icon: EditIcon,
        label: "Editar",
        onClick: (combo) => {
            console.log("Editar combo:", combo);
        },
        color: "#000000",
    },
    {
        icon: PauseIcon,
        label: "Desativar",
        onClick: (combo) => {
            console.log("Desativar combo:", combo);
        },
        color: "#000000",
    },
];

export default function DatatableMockedProdutos() {
    return (
        <DataTable
            getMethod={getCombos}
            columnDef={columnDef}
            actions={actions}
        />
    );
}