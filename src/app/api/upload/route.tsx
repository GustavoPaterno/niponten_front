import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { TAMANHO_MAXIMO_IMAGEM, TIPOS_DE_IMAGEM } from "@/src/lib/imagem";

const HOST_DO_BLOB = /\.private\.blob\.vercel-storage\.com$/i;

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return erro("Arquivo não enviado", 400);
    }

    if (!TIPOS_DE_IMAGEM.includes(file.type)) {
      return erro("Formato não suportado. Envie uma imagem JPG, PNG ou WebP.", 400);
    }

    if (file.size > TAMANHO_MAXIMO_IMAGEM) {
      return erro("A imagem é grande demais. O limite é de 4 MB.", 413);
    }

    const blob = await put(`imagens/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Erro ao fazer upload:", error);

    return erro("Erro ao fazer upload do arquivo", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { url } = (await request.json()) as { url?: unknown };

    if (typeof url !== "string") {
      return erro("URL não informada", 400);
    }

    let host: string;

    try {
      const endereco = new URL(url);

      if (endereco.protocol !== "https:") {
        return erro("URL inválida", 400);
      }

      host = endereco.hostname;
    } catch {
      return erro("URL inválida", 400);
    }

    if (!HOST_DO_BLOB.test(host)) {
      return erro("Esta URL não pertence ao armazenamento de imagens", 400);
    }

    await del(url);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao apagar imagem:", error);

    return erro("Erro ao apagar a imagem", 500);
  }
}
