"use client";

import { useRef, useState, type ReactNode } from "react";
import { Tooltip } from "@mui/material";

interface TruncatedTextProps {
    children: ReactNode;

    /** Largura máxima antes de truncar (número = px, ou qualquer valor CSS). */
    maxWidth?: number | string;

    className?: string;
}

/**
 * Mantém o texto em uma única linha e, quando ele não cabe no espaço
 * disponível, corta com "…" e mostra o texto completo em um tooltip.
 * O tooltip só aparece se o texto estiver realmente cortado.
 */
export default function TruncatedText({
    children,
    maxWidth,
    className = "",
}: TruncatedTextProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [tooltip, setTooltip] = useState("");

    const verificarCorte = () => {
        const el = ref.current;

        setTooltip(
            el && el.scrollWidth > el.clientWidth ? (el.textContent ?? "") : ""
        );
    };

    return (
        <Tooltip title={tooltip} placement="top" arrow enterDelay={300}>
            <span
                ref={ref}
                onMouseEnter={verificarCorte}
                onFocus={verificarCorte}
                className={`block truncate ${className}`}
                style={{ maxWidth }}
            >
                {children}
            </span>
        </Tooltip>
    );
}
