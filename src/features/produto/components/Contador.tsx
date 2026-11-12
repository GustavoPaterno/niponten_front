import { Add, Remove } from "@mui/icons-material";

interface ContadorProps {
    valor: number;
    min?: number;
    max?: number;
    onChange: (valor: number) => void;
    /** Nome do que está sendo contado, para os leitores de tela ("Milho", "quantidade"). */
    rotulo: string;
    tamanho?: "sm" | "md";
    desabilitado?: boolean;
}

/** Seletor − n +. */
export default function Contador({
    valor,
    min = 0,
    max = 99,
    onChange,
    rotulo,
    tamanho = "sm",
    desabilitado = false,
}: ContadorProps) {
    const botao =
        tamanho === "md"
            ? "h-11 w-11"
            : "h-9 w-9";
    const base = `flex ${botao} items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-30`;

    return (
        <div className="flex shrink-0 items-center gap-1" role="group" aria-label={rotulo}>
            <button
                type="button"
                onClick={() => onChange(Math.max(min, valor - 1))}
                disabled={desabilitado || valor <= min}
                aria-label={`Diminuir ${rotulo}`}
                className={`${base} text-tinta-suave hover:bg-chapa active:bg-black/10`}
            >
                <Remove fontSize="small" />
            </button>

            <span
                className={`min-w-6 text-center font-semibold tabular-nums ${
                    valor > 0 ? "text-tinta" : "text-tinta-suave/70"
                } ${tamanho === "md" ? "text-lg" : ""}`}
                aria-live="polite"
            >
                {valor}
            </span>

            <button
                type="button"
                onClick={() => onChange(Math.min(max, valor + 1))}
                disabled={desabilitado || valor >= max}
                aria-label={`Aumentar ${rotulo}`}
                className={`${base} bg-marca/10 text-marca hover:bg-marca/20 active:bg-marca/25`}
            >
                <Add fontSize="small" />
            </button>
        </div>
    );
}
