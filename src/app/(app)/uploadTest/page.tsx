"use client";

import { useState } from "react";

/** Página interna para testar o envio de imagens ao Vercel Blob. */
export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) {
      return;
    }

    setLoading(true);
    setErro(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setUrl(data.url);
    } catch (error) {
      console.error(error);
      setErro(error instanceof Error && error.message ? error.message : "O envio falhou. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-2 pt-4 text-tinta md:pt-8">
      <div className="rounded-3xl bg-white p-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Teste de upload</h1>
        <p className="mt-1 text-sm text-tinta-suave">Envia uma imagem ao Vercel Blob e mostra o link gerado.</p>

        <input
          type="file"
          aria-label="Arquivo para enviar"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
          }}
          className="mt-6 block w-full rounded-xl bg-chapa p-3 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-tinta file:px-3 file:py-2 file:font-display file:font-bold file:text-white"
        />

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="mt-4 h-12 w-full cursor-pointer rounded-xl bg-marca font-display font-bold text-white transition-colors hover:bg-marca-escura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>

        {erro && (
          <p role="alert" className="mt-4 rounded-xl bg-erro-fundo px-4 py-3 text-sm font-semibold text-erro">
            {erro}
          </p>
        )}

        {url && (
          <div className="mt-4 rounded-xl bg-chapa px-4 py-3 text-sm">
            <p className="font-bold">Enviado</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-marca underline">
              {url}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
