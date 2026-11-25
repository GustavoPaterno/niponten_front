import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

const HOST_DO_BLOB = /^[a-z0-9-]+\.private\.blob\.vercel-storage\.com$/i;

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL não informada" }, { status: 400 });
  }

  let endereco: URL;

  try {
    endereco = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  if (endereco.protocol !== "https:" || !HOST_DO_BLOB.test(endereco.hostname)) {
    return NextResponse.json({ error: "Esta URL não pertence ao armazenamento de imagens" }, { status: 400 });
  }

  try {
    const resultado = await get(endereco.toString(), {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!resultado) {
      return NextResponse.json({ error: "Imagem não encontrada" }, { status: 404 });
    }

    if (resultado.statusCode === 304) {
      return new NextResponse(null, { status: 304, headers: { ETag: resultado.blob.etag, "Cache-Control": "public, max-age=31536000, immutable" } });
    }

    if (!resultado.blob.contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Arquivo não é uma imagem" }, { status: 415 });
    }

    return new NextResponse(resultado.stream, {
      headers: {
        "Content-Type": resultado.blob.contentType,
        "Content-Length": String(resultado.blob.size),
        ETag: resultado.blob.etag,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao ler imagem:", error);

    return NextResponse.json({ error: "Erro ao carregar a imagem" }, { status: 500 });
  }
}
