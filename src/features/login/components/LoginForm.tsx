"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Field from "@/src/components/auth/Field";
import { entrar } from "@/src/lib/auth";
import { linkDeAcesso } from "@/src/lib/navegacao";
import { mensagemDeErro } from "@/src/lib/http";

export default function LoginForm({ voltar }: { voltar: string | null }) {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro(null);
        setAviso(null);
        setEnviando(true);

        try {
            const destino = await entrar({ email, password }, voltar);
            router.push(destino);
        } catch (e) {
            setErro(mensagemDeErro(e));
            setEnviando(false);
        }
    }

    function handleEsqueciSenha() {
        setErro(null);
        setAviso(
            "A recuperação de senha ainda não está disponível. Fale com o restaurante para redefinir a sua."
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {erro && (
                <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-sm font-semibold text-erro">
                    {erro}
                </p>
            )}
            {aviso && (
                <p role="status" className="rounded-lg bg-chapa px-4 py-3 text-sm font-semibold text-tinta">
                    {aviso}
                </p>
            )}

            <Field
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <div className="flex flex-col gap-2">
                <Field
                    label="Senha"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="button"
                    onClick={handleEsqueciSenha}
                    className="cursor-pointer self-end text-sm font-bold text-marca-escura hover:underline"
                >
                    Esqueci minha senha
                </button>
            </div>

            <button
                type="submit"
                disabled={enviando || !email.trim() || !password}
                className="h-12 cursor-pointer rounded-xl bg-marca font-display text-base font-bold text-white transition-colors hover:bg-marca-escura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-60"
            >
                {enviando ? "Entrando..." : "Entrar"}
            </button>

            <div className="flex flex-col gap-3 pt-2">
                <p className="text-center text-sm text-tinta-suave">
                    Ainda não tem conta?
                </p>
                <Link
                    href={linkDeAcesso("/cadastro", voltar)}
                    className="flex h-12 items-center justify-center rounded-xl border-2 border-tinta font-display text-base font-bold text-tinta transition-colors hover:bg-tinta hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                >
                    Criar conta
                </Link>
            </div>
        </form>
    );
}
