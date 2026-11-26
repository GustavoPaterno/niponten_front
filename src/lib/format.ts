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

/** (11) 91234-5678, enquanto o usuário digita. */
export function mascararTelefone(valor: string): string {
    const d = valor.replace(/\D/g, "").slice(0, 11);

    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Telefone com DDD: 10 dígitos (fixo) ou 11 (celular). */
export function telefoneValido(valor: string): boolean {
    return valor.replace(/\D/g, "").length >= 10;
}
