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
    onClick?: () => void;
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
        [ButtonColor.Primary]: "bg-[#EE2C2E] text-white",
        [ButtonColor.Secondary]: "bg-gray-600 text-white",
        [ButtonColor.Green]: "bg-green-600 text-white",
        [ButtonColor.Danger]: "bg-red-600 text-white",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                flex items-center justify-center gap-2
                px-4 py-2
                rounded-md
                h-10
                cursor-pointer
                transition-opacity
                hover:opacity-80
                ${colors[color]}
            `}
        >
            {Icon && <Icon sx={{ color: (iconColor ?? "#FFFFFF"), fontSize: 30 }} />}

            <span className="flex-1 truncate">{text}</span>
        </button>
    );
}