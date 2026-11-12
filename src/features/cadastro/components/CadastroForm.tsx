"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Field from "@/src/components/auth/Field";
import { entrar } from "@/src/lib/auth";
import { linkDeAcesso } from "@/src/lib/navegacao";
import { cadastrarCliente } from "@/src/services/usuarios";
import { mensagemDeErro } from "@/src/lib/http";

const VAZIO = {
    name: "",
    lastName: "",
    email: "",
    password: "",
};

export default function CadastroForm({ voltar }: { voltar: string | null }) {
    const router = useRouter();

    const [form, setForm] = useState(VAZIO);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    function campo(nome: keyof typeof VAZIO) {
        return {
            name: nome,
            value: form[nome],
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((atual) => ({ ...atual, [nome]: e.target.value })),
        };
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro(null);

        setEnviando(true);

        try {
            await cadastrarCliente({
                name: form.name,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
            });

            const destino = await entrar({
                email: form.email,
                password: form.password,
            }, voltar);
            router.push(destino);
        } catch (e) {
            setErro(mensagemDeErro(e));
            setEnviando(false);
        }
    }

    const incompleto =
        !form.name.trim() ||
        !form.lastName.trim() ||
        !form.email.trim() ||
        !form.password;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {erro && (
                <p role="alert" className="rounded-xl bg-erro-fundo px-4 py-3 text-sm font-semibold text-erro">
                    {erro}
                </p>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Nome" autoComplete="given-name" required {...campo("name")} />
                <Field label="Sobrenome" autoComplete="family-name" required {...campo("lastName")} />
            </div>

            <Field
                label="E-mail"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                required
                {...campo("email")}
            />

            <Field
                label="Senha"
                type="password"
                autoComplete="new-password"
                required
                {...campo("password")}
            />

            <button
                type="submit"
                disabled={enviando || incompleto}
                className="h-12 cursor-pointer rounded-xl bg-marca font-display text-base font-bold text-white transition-colors hover:bg-marca-escura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta disabled:cursor-not-allowed disabled:opacity-60"
            >
                {enviando ? "Criando conta..." : "Criar conta"}
            </button>

            <div className="flex flex-col gap-3 pt-2">
                <p className="text-center text-sm text-tinta-suave">Já tem conta?</p>
                <Link
                    href={linkDeAcesso("/login", voltar)}
                    className="flex h-12 items-center justify-center rounded-xl border-2 border-tinta font-display text-base font-bold text-tinta transition-colors hover:bg-tinta hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca"
                >
                    Entrar
                </Link>
            </div>
        </form>
    );
}
