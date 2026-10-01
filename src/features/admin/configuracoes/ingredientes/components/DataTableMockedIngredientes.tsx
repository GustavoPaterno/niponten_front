"use client";

import Image from "next/image";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";

import {
    DataTable,
    DataTableAction,
    DataTableColumn,
} from "../../../../../components/table/Datatable";

interface Ingrediente {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    status: "ACTIVE";
}

const ingredientesMock: Ingrediente[] = [
    {
        id: 1,
        name: "Queijo",
        description: "Queijo mussarela fatiado",
        imageUrl: "/images/marusan-logo.jpg",
        price: 12.5,
        status: "ACTIVE",
    },
    {
        id: 2,
        name: "Massa",
        description: "Massa artesanal",
        imageUrl: "/images/marusan-logo.jpg",
        price: 8.9,
        status: "ACTIVE",
    },
    {
        id: 3,
        name: "Chocolate",
        description: "Chocolate ao leite",
        imageUrl: "/images/marusan-logo.jpg",
        price: 15,
        status: "ACTIVE",
    },
    {
        id: 4,
        name: "Chocolate Branco",
        description: "Chocolate branco",
        imageUrl: "/images/marusan-logo.jpg",
        price: 17.5,
        status: "ACTIVE",
    },
    {
        id: 5,
        name: "Catupiri",
        description: "Requeijão cremoso tipo Catupiry",
        imageUrl: "/images/marusan-logo.jpg",
        price: 18,
        status: "ACTIVE",
    },
    {
        id: 6,
        name: "Carne Bovina",
        description: "Carne bovina moída",
        imageUrl: "/images/marusan-logo.jpg",
        price: 29.9,
        status: "ACTIVE",
    },
    {
        id: 7,
        name: "Bacon",
        description: "Bacon em cubos",
        imageUrl: "/images/marusan-logo.jpg",
        price: 24.9,
        status: "ACTIVE",
    },
    {
        id: 8,
        name: "Queijo Muzzarela",
        description: "Muzzarela fatiada",
        imageUrl: "/images/marusan-logo.jpg",
        price: 14.9,
        status: "ACTIVE",
    },
];

const getIngredientes = async (): Promise<Ingrediente[]> => {
    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    return ingredientesMock;

};

const columnDef: DataTableColumn<Ingrediente>[] = [
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
        headerName: "Ingrediente",
    },
    {
        field: "description",
        type: "text",
        headerName: "Descrição",
    },
    {
        field: "price",
        type: "text",
        headerName: "Preço",
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

const actions: DataTableAction<Ingrediente>[] = [
    {
        icon: EditIcon,
        label: "Editar",
        onClick: (ingrediente) => {
            console.log(
                "Editar ingrediente:",
                ingrediente
            );
        },
        color: "#000000",
    },
    {
        icon: PauseIcon,
        label: "Desativar",
        onClick: (ingrediente) => {
            console.log(
                "Desativar ingrediente:",
                ingrediente
            );
        },
        color: "#000000",
    },
];

export default function DatatableMockedIngredientes() {
    return (
        <DataTable getMethod={getIngredientes} columnDef={columnDef} actions={actions} />
    );
}