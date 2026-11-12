import Image from "next/image";
import Link from "next/link";

/** Página para endereços que não existem: devolve a pessoa ao cardápio. */
export default function NotFound() {
    return (
        <main className="flex min-h-dvh w-full flex-col bg-chapa text-tinta">
            <header className="relative overflow-hidden bg-marca text-white">
                <div aria-hidden="true" className="loja-sol" />

                <div className="relative mx-auto flex max-w-md items-center gap-3 px-5 pb-16 pt-8">
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
            </header>

            <section className="relative mx-auto -mt-10 w-full max-w-md px-3 pb-10 sm:px-0">
                <div className="rounded-3xl bg-white px-6 py-9 text-center">
                    <p className="font-display text-6xl font-extrabold tracking-tight text-marca">404</p>
                    <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
                        Essa página não está no cardápio
                    </h1>
                    <p className="mt-2 text-sm text-tinta-suave">
                        O endereço pode ter mudado ou estar digitado errado.
                    </p>

                    <Link
                        href="/"
                        className="mt-7 flex h-12 items-center justify-center rounded-xl bg-marca font-display font-bold text-white transition-colors hover:bg-marca-escura focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tinta"
                    >
                        Ver cardápio
                    </Link>
                </div>
            </section>
        </main>
    );
}
