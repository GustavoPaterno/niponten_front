"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Field from "@/src/components/auth/Field";
import { entrar } from "@/src/lib/auth";
import { cadastrarCliente } from "@/src/services/usuarios";
import { mensagemDeErro } from "@/src/lib/http";

const VAZIO = {
    name: "",
    lastName: "",
    email: "",
    password: "",
};

export default function CadastroForm() {
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

            // Conta criada: já entra e vai para a área do usuário.
            const destino = await entrar({
                email: form.email,
                password: form.password,
            });
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
                <p role="alert" className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
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
                className="h-11 cursor-pointer rounded-xl bg-(--primary) text-base font-black tracking-wide text-white transition-colors hover:bg-[#C92325] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {enviando ? "CRIANDO CONTA..." : "CRIAR CONTA"}
            </button>

            <div className="flex flex-col gap-3 pt-2">
                <p className="text-center text-sm text-neutral-600">Já tem conta?</p>
                <Link
                    href="/login"
                    className="flex h-11 items-center justify-center rounded-xl bg-neutral-900 text-base font-black tracking-wide text-white transition-colors hover:bg-black"
                >
                    ENTRAR
                </Link>
            </div>
        </form>
    );
}
