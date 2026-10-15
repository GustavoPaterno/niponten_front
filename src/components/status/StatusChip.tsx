type StatusTone = "success" | "neutral" | "warning";

const TONES: Record<StatusTone, string> = {
    success: "bg-green-100 text-green-700",
    neutral: "bg-gray-100 text-gray-600",
    warning: "bg-amber-100 text-amber-700",
};

interface StatusChipProps {
    label: string;
    tone: StatusTone;
}

export default function StatusChip({ label, tone }: StatusChipProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
        >
            {label}
        </span>
    );
}
