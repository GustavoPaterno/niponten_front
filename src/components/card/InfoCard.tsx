import React from "react";

interface InfoCardProps {
    size: "1/2" | "1/3";
    icon: React.ElementType;
    iconColor: string;
    title: string;
    text: string;
}

export default function InfoCard({
    size,
    icon: Icon,
    iconColor,
    title,
    text,
}: InfoCardProps) {
    return (
        <div
            className={`${size === "1/2" ? "w-1/2" : "w-1/3"} h-full flex flex-row rounded-xl shadow-component p-5`}
        >  
            <div className="h-full w-[40%] flex justify-center items-center">
                <div className="w-fit p-2 sm:p-4 shadow-component rounded-xl"
                    style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 40%, transparent)`,}}
                >
                    <Icon sx={{ color: iconColor, fontSize: 30 }} />
                </div>
            </div>

            <div className="h-full w-[60%] gap-2 flex flex-col justify-center items-center">
                <h3 className="text-black opacity-60">{title}</h3>
                <p className="text-black opacity-100 font-bold">{text}</p>
            </div>
        </div>
    );
}