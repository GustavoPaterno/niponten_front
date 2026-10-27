"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Field from "@/src/components/auth/Field";
import { entrar } from "@/src/lib/auth";
import { mensagemDeErro } from "@/src/lib/http";

export default function LoginForm() {
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
            const destino = await entrar({ email, password });
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
                <p role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
                    {erro}
                </p>
            )}
            {aviso && (
                <p role="status" className="rounded-lg bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-800">
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
                    className="cursor-pointer self-end text-sm font-bold text-[#A81B1D] hover:underline"
                >
                    Esqueci minha senha
                </button>
            </div>

            <button
                type="submit"
                disabled={enviando || !email.trim() || !password}
                className="h-11 cursor-pointer rounded-xl bg-(--primary) text-base font-black tracking-wide text-white transition-colors hover:bg-[#C92325] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {enviando ? "ENTRANDO..." : "ENTRAR"}
            </button>

            <div className="flex flex-col gap-3 pt-2">
                <p className="text-center text-sm text-neutral-600">
                    Ainda não tem conta?
                </p>
                <Link
                    href="/cadastro"
                    className="flex h-11 items-center justify-center rounded-xl bg-neutral-900 text-base font-black tracking-wide text-white transition-colors hover:bg-black"
                >
                    CADASTRAR
                </Link>
            </div>
        </form>
    );
}
