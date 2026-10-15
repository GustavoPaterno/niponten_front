"use client";

import type { ReactNode } from "react";
import { TextField, TextFieldProps } from "@mui/material";

/** Tamanho máximo dos campos de texto (coluna varchar(255) no banco). */
export const MAX_CARACTERES = 255;

type LimitedTextFieldProps = Omit<TextFieldProps, "variant" | "helperText"> & {
    /** Limite de caracteres. Padrão: 255. */
    maxChars?: number;

    /** Mensagem de ajuda ou de erro, exibida à esquerda do contador. */
    helperText?: ReactNode;
};

/**
 * TextField com limite de caracteres: bloqueia a digitação no limite e mostra
 * um contador (ex.: 12/255) no canto inferior direito do campo.
 */
export default function LimitedTextField({
    maxChars = MAX_CARACTERES,
    helperText,
    value,
    slotProps,
    ...rest
}: LimitedTextFieldProps) {
    const length = String(value ?? "").length;

    const counterColor =
        length >= maxChars
            ? "text-red-600"
            : length >= maxChars * 0.9
              ? "text-amber-600"
              : "text-gray-500";

    return (
        <TextField
            {...rest}
            value={value}
            slotProps={{
                ...slotProps,
                htmlInput: {
                    ...(slotProps?.htmlInput as object | undefined),
                    maxLength: maxChars,
                },
            }}
            helperText={
                <span className="flex items-start justify-between gap-3">
                    <span>{helperText}</span>

                    <span className={`ml-auto shrink-0 tabular-nums ${counterColor}`}>
                        {length}/{maxChars}
                    </span>
                </span>
            }
        />
    );
}
