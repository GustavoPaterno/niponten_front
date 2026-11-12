import { ReactNode } from "react";

export enum ButtonColor {
    Primary = "primary",
    Secondary = "secondary",
    Danger = "danger",
    Green = "green",
}


interface ButtonProps {
    text: string;
    icon?: React.ElementType;
    iconColor?: string;
    onClick: (
        event: React.MouseEvent<HTMLButtonElement>
    ) => void;
    color?: ButtonColor;
}

export default function Button({
    text,
    icon: Icon,
    iconColor,
    onClick,
    color = ButtonColor.Primary,
}: ButtonProps) {
    const colors: Record<ButtonColor, string> = {
        [ButtonColor.Primary]: "bg-marca text-white",
        [ButtonColor.Secondary]: "bg-white text-tinta ring-2 ring-inset ring-black/15 hover:ring-tinta",
        // "Green" é a ação de confirmar (salvar, criar): usa o vermelho da marca.
        [ButtonColor.Green]: "bg-marca text-white",
        [ButtonColor.Danger]: "bg-marca-escura text-white",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center justify-center gap-2
                px-4 py-2
                rounded-xl font-display font-bold
                h-10
                cursor-pointer
                transition-opacity
                hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta
                ${colors[color]}
            `}
        >
            {Icon && <Icon sx={{ color: iconColor ?? "currentColor", fontSize: 26 }} />}

            <span className="flex-1 truncate">{text}</span>
        </button>
    );
}