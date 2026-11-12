import Image from "next/image";

import { urlDeImagem } from "@/src/lib/imagem";

const FALLBACK = "/images/marusan-logo.jpg";

interface ImagemItemProps {
    src: string | null;
    alt: string;
    className?: string;
}

/** Foto de um item do cardápio. Sem foto (ou com URL inválida), mostra a logo da Marusan esmaecida. */
export default function ImagemItem({ src: original, alt, className = "" }: ImagemItemProps) {
    const src = urlDeImagem(original);

    return (
        <div className={`relative overflow-hidden bg-chapa ${className}`}>
            <Image
                src={src || FALLBACK}
                alt={alt}
                fill
                unoptimized
                sizes="(max-width: 640px) 70vw, 260px"
                className={src ? "object-cover" : "object-contain p-[18%] opacity-20 grayscale"}
            />
        </div>
    );
}
