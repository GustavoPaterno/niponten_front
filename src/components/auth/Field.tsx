import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
}

/** Campo de texto padrão das telas de acesso (rótulo + input), no visual da marca. */
export default function Field({ label, id, className = "", ...props }: FieldProps) {
    const campoId = id ?? props.name;

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={campoId} className="text-sm font-bold text-neutral-900">
                {label}
            </label>
            <input
                id={campoId}
                {...props}
                className="h-12 w-full rounded-lg bg-neutral-100 px-4 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-500 focus:bg-white focus:ring-2 focus:ring-(--primary) disabled:opacity-60"
            />
        </div>
    );
}
