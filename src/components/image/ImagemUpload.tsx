"use client";

import { useRef, useState } from "react";
import { DeleteOutlined, PhotoCamera } from "@mui/icons-material";

import ImagemItem from "@/src/features/menu/components/ImagemItem";
import { TIPOS_DE_IMAGEM, validarImagem } from "@/src/lib/imagem";
import { SEM_ALTERACAO, type ImagemEscolha } from "@/src/lib/uploadImagem";

interface ImagemUploadProps {
    urlAtual: string | null;
    value: ImagemEscolha;
    onChange: (escolha: ImagemEscolha) => void;
    disabled?: boolean;
}

function lerComoDataUrl(arquivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => resolve(String(leitor.result));
        leitor.onerror = () => reject(leitor.error);
        leitor.readAsDataURL(arquivo);
    });
}

export default function ImagemUpload({ urlAtual, value, onChange, disabled }: ImagemUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    const mostrando = value.arquivo ? preview : value.remover ? null : urlAtual;
    const temImagem = Boolean(value.arquivo) || (!value.remover && Boolean(urlAtual));

    const escolher = async (arquivo: File | undefined) => {
        if (!arquivo) {
            return;
        }

        const invalida = validarImagem(arquivo);

        if (invalida) {
            setErro(invalida);

            return;
        }

        setErro(null);

        try {
            setPreview(await lerComoDataUrl(arquivo));
            onChange({ arquivo, remover: false });
        } catch {
            setErro("Não foi possível ler esta imagem. Tente outra.");
        }
    };

    const remover = () => {
        setErro(null);
        setPreview(null);
        onChange(urlAtual ? { arquivo: null, remover: true } : SEM_ALTERACAO);
    };

    return (
        <div>
            <span className="mb-2 block text-sm font-semibold text-tinta">Imagem</span>

            <div className="flex items-center gap-4">
                <ImagemItem src={mostrando} alt="Pré-visualização da imagem" className="h-24 w-24 shrink-0 rounded-xl" />

                <div className="flex flex-col items-start gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept={TIPOS_DE_IMAGEM.join(",")}
                        aria-label="Escolher imagem"
                        disabled={disabled}
                        onChange={(event) => {
                            void escolher(event.target.files?.[0]);
                            event.target.value = "";
                        }}
                        className="hidden"
                    />

                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => inputRef.current?.click()}
                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-tinta ring-2 ring-inset ring-black/15 transition hover:ring-tinta disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <PhotoCamera fontSize="small" />
                        {temImagem ? "Trocar imagem" : "Escolher imagem"}
                    </button>

                    {temImagem && (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={remover}
                            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1 text-sm font-semibold text-marca-escura transition hover:bg-chapa disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <DeleteOutlined fontSize="small" />
                            Remover imagem
                        </button>
                    )}
                </div>
            </div>

            <p className={`mt-2 text-xs ${erro ? "font-semibold text-erro" : "text-tinta-suave"}`} role={erro ? "alert" : undefined}>
                {erro ?? "JPG, PNG ou WebP, até 4 MB."}
            </p>
        </div>
    );
}
