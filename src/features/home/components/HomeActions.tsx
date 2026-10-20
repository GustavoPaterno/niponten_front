import Link from "next/link";

const base =
  "flex h-11 w-full items-center justify-between rounded-xl px-5 text-base font-black tracking-wide text-white shadow-lg transition-colors focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

export default function HomeActions() {
  return (
    <nav className="flex flex-col gap-5" aria-label="Ações principais">
      <Link
        href="/menu"
        className={`${base} bg-(--primary) shadow-red-600/40 hover:bg-[#C92325]`}
      >
        <span>PEDIR AGORA</span>
        <span aria-hidden="true" className="text-xl leading-none">›</span>
      </Link>

      <Link
        href="/login"
        className={`${base} bg-neutral-900 shadow-black/30 hover:bg-black`}
      >
        <span>ENTRAR/CADASTRAR</span>
        <span aria-hidden="true" className="text-xl leading-none">›</span>
      </Link>
    </nav>
  );
}
