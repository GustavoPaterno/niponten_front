import Image from "next/image";
import Link from "next/link";
import { ArrowBack } from "@mui/icons-material";

/**
 * Moldura do login e do cadastro: a mesma faixa vermelha da loja, com o formulário num cartão
 * que sobe sobre ela. O link do topo devolve ao cardápio, que não exige conta.
 */
export default function AuthShell({
    title,
    subtitle,
    children,
}: {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-dvh w-full flex-col bg-chapa">
            <header className="relative overflow-hidden bg-marca text-white">
                <div aria-hidden="true" className="loja-sol" />

                <div className="relative mx-auto flex max-w-md flex-col gap-6 px-5 pb-16 pt-4">
                    <Link
                        href="/"
                        className="-ml-2 flex h-10 w-fit items-center gap-1.5 rounded-full pl-2 pr-3 font-display text-sm font-bold hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
                    >
                        <ArrowBack fontSize="small" />
                        Voltar ao cardápio
                    </Link>

                    <div className="flex items-center gap-3">
                        <Image
                            src="/images/marusan-logo.jpg"
                            alt=""
                            width={56}
                            height={56}
                            priority
                            className="h-14 w-14 rounded-full bg-white ring-2 ring-white"
                        />
                        <p className="font-display text-3xl font-extrabold tracking-tight">Marusan</p>
                    </div>
                </div>
            </header>

            <section className="relative mx-auto -mt-10 w-full max-w-md flex-1 px-3 pb-10 sm:px-0">
                <div className="rounded-3xl bg-white px-5 py-7 sm:px-8 sm:py-9">
                    {title && (
                        <h1 className="font-display text-3xl font-extrabold tracking-tight text-tinta">
                            {title}
                        </h1>
                    )}
                    {subtitle && <p className="mt-1 text-sm text-tinta-suave">{subtitle}</p>}
                    {(title || subtitle) && <div className="mb-7" />}

                    {children}
                </div>
            </section>
        </main>
    );
}
