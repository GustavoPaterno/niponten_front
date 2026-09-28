"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
    Box,
    IconButton,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";

import {
    ChevronLeft,
    ChevronRight,
    Search,
} from "@mui/icons-material";

export type DataTableColumn<T> = {
    [K in keyof T]: {
        field: K;
        headerName: string;
        type?: "text" | "image";
        width?: string;
        render?: (
            value: T[K],
            row: T
        ) => React.ReactNode;
    }
}[keyof T];

export interface DataTableAction<T> {
    icon: React.ElementType;
    label: string;
    onClick: (row: T) => void;
    color?: string;
}

export interface DataTableProps<T> {
    getMethod: () => Promise<T[]>;
    columnDef: DataTableColumn<T>[];
    actions?: DataTableAction<T>[];

    pageSize?: number;
    searchPlaceholder?: string;
    emptyMessage?: string;
}

export function DataTable<T>({
    getMethod,
    columnDef,
    actions = [],
    pageSize = 10,
    searchPlaceholder = "Pesquisar...",
    emptyMessage = "Nenhum registro encontrado.",
}: DataTableProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof T | "">("");
    const [sortDirection, setSortDirection] = useState<
        "asc" | "desc"
    >("asc");

    const [page, setPage] = useState(1);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const result = await getMethod();

                setData(result);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [getMethod]);

    const filteredData = useMemo(() => {
        if (!search.trim()) {
            return data;
        }

        const searchValue = search.toLowerCase();

        return data.filter((row) =>
            columnDef.some((column) => {
                const value = row[column.field];

                return String(value ?? "")
                    .toLowerCase()
                    .includes(searchValue);
            })
        );
    }, [data, search, columnDef]);

    const sortedData = useMemo(() => {
        if (!sortField) {
            return filteredData;
        }

        return [...filteredData].sort((a, b) => {
            const valueA = a[sortField];
            const valueB = b[sortField];

            if (valueA == null && valueB == null) {
                return 0;
            }

            if (valueA == null) {
                return 1;
            }

            if (valueB == null) {
                return -1;
            }

            if (valueA < valueB) {
                return sortDirection === "asc" ? -1 : 1;
            }

            if (valueA > valueB) {
                return sortDirection === "asc" ? 1 : -1;
            }

            return 0;
        });
    }, [
        filteredData,
        sortField,
        sortDirection,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(sortedData.length / pageSize)
    );

    const currentPage = Math.min(page, totalPages);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        return sortedData.slice(start, end);
    }, [
        sortedData,
        currentPage,
        pageSize,
    ]);

    useEffect(() => {
        setPage(1);
    }, [search, sortField, sortDirection]);

    const handleSortChange = (
        value: string
    ) => {
        if (!value) {
            setSortField("");
            return;
        }

        const field = value as keyof T;

        if (sortField === field) {
            setSortDirection((current) =>
                current === "asc" ? "desc" : "asc"
            );

            return;
        }

        setSortField(field);
        setSortDirection("asc");
    };

    const firstItem =
        sortedData.length === 0
            ? 0
            : (currentPage - 1) * pageSize + 1;

    const lastItem = Math.min(
        currentPage * pageSize,
        sortedData.length
    );

    return (
        <Box className="w-full overflow-hidden bg-white shadow-component rounded-xl">
            <Box className="flex flex-col gap-3 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <TextField
                    size="small"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                    slotProps={{
                        input: {
                            startAdornment: (
                                <Search
                                    fontSize="small"
                                    className="mr-2 text-gray-400"
                                />
                            ),
                        },
                    }}
                    className="w-full sm:max-w-xs rounded-xl"
                />

                <Select
                    size="small"
                    value={sortField as string}
                    displayEmpty
                    onChange={(event) =>
                        handleSortChange(event.target.value)
                    }
                    className="w-full sm:w-52"
                >
                    <MenuItem value="">
                        Ordenar por
                    </MenuItem>

                    {columnDef.map((column) => (
                        <MenuItem
                            key={String(column.field)}
                            value={String(column.field)}
                        >
                            {column.headerName}
                        </MenuItem>
                    ))}
                </Select>
            </Box>

            <Box className="w-full overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                            {columnDef.map((column) => (
                                <th
                                    key={String(column.field)}
                                    style={{
                                        width: column.width,
                                    }}
                                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 sm:px-4"
                                >
                                    {column.headerName}
                                </th>
                            ))}

                            {actions.length > 0 && (
                                <th className="w-24 px-3 py-3 text-right text-xs font-semibold text-gray-500 sm:px-4">
                                    Ações
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={
                                        columnDef.length +
                                        (actions.length > 0 ? 1 : 0)
                                    }
                                    className="h-40 px-4 text-center"
                                >
                                    <Typography
                                        variant="body2"
                                        className="text-gray-500"
                                    >
                                        Carregando...
                                    </Typography>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        columnDef.length +
                                        (actions.length > 0 ? 1 : 0)
                                    }
                                    className="h-40 px-4 text-center"
                                >
                                    <Typography
                                        variant="body2"
                                        className="text-gray-500"
                                    >
                                        {emptyMessage}
                                    </Typography>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map(
                                (row, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                                    >
                                        {columnDef.map(
                                            (column) => {
                                                const value =
                                                    row[
                                                        column.field
                                                    ];

                                                return (
                                                    <td
                                                        key={String(
                                                            column.field
                                                        )}
                                                        style={{
                                                            width: column.width,
                                                        }}
                                                        className="px-3 py-3 text-sm text-gray-700 sm:px-4"
                                                    >
                                                        {column.render
                                                            ? column.render(
                                                                  value,
                                                                  row
                                                              )
                                                            : String(
                                                                  value ??
                                                                      ""
                                                              )}
                                                    </td>
                                                );
                                            }
                                        )}

                                        {actions.length > 0 && (
                                            <td className="px-3 py-3 sm:px-4">
                                                <Box className="flex justify-end gap-1">
                                                    {actions.map(
                                                        (
                                                            action,
                                                            actionIndex
                                                        ) => {
                                                            const Icon =
                                                                action.icon;

                                                            return (
                                                                <IconButton
                                                                    key={
                                                                        actionIndex
                                                                    }
                                                                    size="small"
                                                                    title={
                                                                        action.label
                                                                    }
                                                                    onClick={() =>
                                                                        action.onClick(
                                                                            row
                                                                        )
                                                                    }
                                                                    className="hover:bg-gray-100"
                                                                    sx={{
                                                                        color:
                                                                            action.color ??
                                                                            "inherit",
                                                                    }}
                                                                >
                                                                    <Icon fontSize="small" />
                                                                </IconButton>
                                                            );
                                                        }
                                                    )}
                                                </Box>
                                            </td>
                                        )}
                                    </tr>
                                )
                            )
                        )}
                    </tbody>
                </table>
            </Box>

            <Box className="flex flex-col gap-2 border-t border-gray-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <Typography
                    variant="body2"
                    className="text-gray-500"
                >
                    {sortedData.length === 0
                        ? "0 registros"
                        : `${firstItem}-${lastItem} de ${sortedData.length} registros`}
                </Typography>

                <Box className="flex items-center justify-end gap-1">
                    <IconButton
                        size="small"
                        disabled={currentPage === 1}
                        onClick={() =>
                            setPage((current) =>
                                Math.max(1, current - 1)
                            )
                        }
                    >
                        <ChevronLeft fontSize="small" />
                    </IconButton>

                    <Typography
                        variant="body2"
                        className="px-2 text-gray-600"
                    >
                        {currentPage} / {totalPages}
                    </Typography>

                    <IconButton
                        size="small"
                        disabled={
                            currentPage === totalPages
                        }
                        onClick={() =>
                            setPage((current) =>
                                Math.min(
                                    totalPages,
                                    current + 1
                                )
                            )
                        }
                    >
                        <ChevronRight fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}