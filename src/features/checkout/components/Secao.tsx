import { CheckCircle } from "@mui/icons-material";

/** Cartão branco com título, usado por cada parte do checkout. */
export default function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:p-6">
            <h2 className="font-display text-lg font-bold">{titulo}</h2>
            {children}
        </section>
    );
}

interface OpcaoCartaoProps {
    marcado: boolean;
    onClick: () => void;
    icone: React.ReactNode;
    titulo: string;
    descricao: string;
}

/** Opção de escolha única em formato de cartão (tipo de entrega, forma de pagamento). */
export function OpcaoCartao({ marcado, onClick, icone, titulo, descricao }: OpcaoCartaoProps) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={marcado}
            aria-label={`${titulo}: ${descricao}`}
            onClick={onClick}
            className={`relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition ${
                marcado
                    ? "bg-marca/10 text-marca ring-2 ring-marca"
                    : "bg-white text-tinta ring-1 ring-black/10 hover:ring-black/25"
            }`}
        >
            {marcado && <CheckCircle sx={{ fontSize: 16 }} className="absolute right-2 top-2" />}
            {icone}
            <span className="text-sm font-semibold">{titulo}</span>
            <span className="hidden text-[11px] leading-tight text-tinta-suave sm:block">{descricao}</span>
        </button>
    );
}
