export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "—";
    }

    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

/** "2026-10-01T00:00:00" -> "01/10/2026". Vazio/nulo -> "—". */
export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("pt-BR");
}

/** "2026-10-01T00:00:00" -> "2026-10-01T00:00" (valor de <input type="datetime-local">). */
export function toDatetimeInput(value: string | null | undefined): string {
    return value ? value.slice(0, 16) : "";
}

/**
 * Valor de <input type="datetime-local"> ("2026-10-01T08:30") -> LocalDateTime do
 * backend, sem fuso ("2026-10-01T08:30:00"). Vazio -> undefined (campo opcional).
 */
export function fromDatetimeInput(value: string): string | undefined {
    if (!value) {
        return undefined;
    }

    return value.length === 16 ? `${value}:00` : value;
}

/** Texto digitado ("12,50" ou "12.50") -> número. Inválido -> NaN. */
export function parsePreco(value: string): number {
    return Number(value.replace(",", "."));
}
