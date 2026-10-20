import Image from "next/image";

/**
 * Moldura das telas de entrada (home, login e cadastro): painel vermelho da marca e área do formulário.
 * Sem bordas e responsiva: no celular o painel vira uma faixa no topo.
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
        <main className="flex min-h-screen w-full flex-col bg-white md:flex-row">
            <header className="flex flex-col items-center justify-center gap-3 bg-(--primary) px-6 py-8 text-center text-white md:sticky md:top-0 md:h-screen md:w-5/12 md:py-0">
                <Image
                    src="/images/marusan-logo.jpg"
                    alt="Logo Marusan"
                    width={112}
                    height={112}
                    priority
                    className="h-16 w-16 rounded-2xl bg-white shadow-xl shadow-black/30 md:h-28 md:w-28 md:rounded-3xl"
                />
                <p className="text-2xl font-black tracking-[0.14em] md:text-4xl">
                    MARUSAN
                </p>
            </header>

            <section className="flex flex-1 items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">
                    {title && (
                        <h1 className="text-2xl font-extrabold text-neutral-900 md:text-3xl">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
                    )}
                    {(title || subtitle) && <div className="mb-8" />}

                    {children}
                </div>
            </section>
        </main>
    );
}
