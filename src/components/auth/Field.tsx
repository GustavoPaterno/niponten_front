import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

/** Campo de texto padrão das telas de acesso (rótulo + input), no visual da marca. */
export default function Field({ label, id, className = "", ...props }: FieldProps) {
    const campoId = id ?? props.name;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={campoId} className="text-sm font-bold text-tinta">
                {label}
            </label>
            <input
                id={campoId}
                {...props}
                className="h-12 w-full rounded-xl bg-chapa px-4 text-base text-tinta outline-none transition-colors placeholder:text-tinta-suave focus:bg-white focus:ring-2 focus:ring-marca disabled:opacity-60"
            />
        </div>
    );
}
