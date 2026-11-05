import Image from "next/image";

import { urlDeImagem } from "@/src/lib/imagem";

const FALLBACK = "/images/marusan-logo.jpg";

interface ThumbProps {
    src?: string | null;
}

/** Miniatura redonda usada nas tabelas. Sem imagem, mostra a logo da Marusan. */
export default function Thumb({ src }: ThumbProps) {
    return (
        <Image
            src={urlDeImagem(src) ?? FALLBACK}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 rounded-full object-cover"
        />
    );
}
