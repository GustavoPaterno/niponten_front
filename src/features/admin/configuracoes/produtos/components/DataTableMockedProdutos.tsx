"use client";

import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";

import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "../../../../../components/table/Datatable";

interface ProdutoIngrediente {
    id: number;
    name: string;
}

interface Produto {
    id: number;
    name: string;
    imageUrl: string;
    description: string;
    price: number;
    status: "ACTIVE";
    ingredients: ProdutoIngrediente[];
}

const produtosMock: Produto[] = [
    {
        id: 1,
        name: "Pastel de Carne",
        description: "Pastel crocante recheado com carne bovina temperada",
        imageUrl: "/images/marusan-logo.jpg",
        price: 9.9,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Carne Bovina",
            },
            {
                id: 2,
                name: "Massa",
            },
        ],
    },
    {
        id: 2,
        name: "Pastel de Queijo",
        description: "Pastel crocante recheado com queijo mussarela",
        imageUrl: "/images/marusan-logo.jpg",
        price: 9.5,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Queijo Muzzarela",
            },
            {
                id: 2,
                name: "Massa",
            },
        ],
    },
    {
        id: 3,
        name: "Pastel de Carne com Queijo",
        description: "Pastel recheado com carne bovina e queijo",
        imageUrl: "/images/marusan-logo.jpg",
        price: 11.9,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Carne Bovina",
            },
            {
                id: 2,
                name: "Queijo",
            },
            {
                id: 3,
                name: "Massa",
            },
        ],
    },
    {
        id: 4,
        name: "Pastel de Bacon com Queijo",
        description: "Pastel recheado com bacon crocante e queijo",
        imageUrl: "/images/marusan-logo.jpg",
        price: 12.9,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Bacon",
            },
            {
                id: 2,
                name: "Queijo",
            },
            {
                id: 3,
                name: "Massa",
            },
        ],
    },
    {
        id: 5,
        name: "Pastel de Frango com Catupiri",
        description: "Pastel recheado com frango cremoso e catupiri",
        imageUrl: "/images/marusan-logo.jpg",
        price: 12.5,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Catupiri",
            },
            {
                id: 2,
                name: "Queijo Muzzarela",
            },
            {
                id: 3,
                name: "Massa",
            },
        ],
    },
    {
        id: 6,
        name: "Pastel de Chocolate",
        description: "Pastel doce recheado com chocolate ao leite",
        imageUrl: "/images/marusan-logo.jpg",
        price: 10.9,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Chocolate",
            },
            {
                id: 2,
                name: "Massa",
            },
        ],
    },
    {
        id: 7,
        name: "Pastel de Chocolate Branco",
        description: "Pastel doce recheado com chocolate branco",
        imageUrl: "/images/marusan-logo.jpg",
        price: 11.5,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Chocolate Branco",
            },
            {
                id: 2,
                name: "Massa",
            },
        ],
    },
    {
        id: 8,
        name: "Pastel de Queijo com Catupiri",
        description: "Pastel recheado com queijo mussarela e catupiri",
        imageUrl: "/images/marusan-logo.jpg",
        price: 11.9,
        status: "ACTIVE",
        ingredients: [
            {
                id: 1,
                name: "Queijo Muzzarela",
            },
            {
                id: 2,
                name: "Catupiri",
            },
            {
                id: 3,
                name: "Massa",
            },
        ],
    },
];

const getProdutos = async (): Promise<Produto[]> => {
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    return produtosMock;
};

const columnDef: DataTableColumn<Produto>[] = [
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
        headerName: "Pastel",
    },
    {
        field: "description",
        type: "text",
        headerName: "Descrição",
    },
    {
        field: "ingredients",
        type: "text",
        headerName: "Ingredientes",
        render: (value) =>
            value
                .map(
                    (ingredient: ProdutoIngrediente) =>
                        ingredient.name
                )
                .join(", "),
    },
    {
        field: "price",
        type: "text",
        headerName: "Preço mínimo",
        render: (value) =>
            `R$ ${value.toFixed(2).replace(".", ",")}`,
    },
    {
        field: "status",
        type: "text",
        headerName: "Status",
        render: (value) => (
            <span className="font-medium text-green-600">
                {value === "ACTIVE" ? "Ativo" : value}
            </span>
        ),
    },
];

const actions: DataTableAction<Produto>[] = [
    {
        icon: EditIcon,
        label: "Editar",
        onClick: (produto) => {
            console.log(
                "Editar pastel:",
                produto
            );
        },
        color: "#000000",
    },
    {
        icon: PauseIcon,
        label: "Desativar",
        onClick: (produto) => {
            console.log(
                "Desativar pastel:",
                produto
            );
        },
        color: "#000000",
    },
];

export default function DatatableMockedProdutos() {
    return (
        <DataTable
            getMethod={getProdutos}
            columnDef={columnDef}
            actions={actions}
        />
    );
}