import Image from "next/image";

export default function SidebarHeader() {
  return (
    <div className="flex items-center gap-2.5 pr-10">
      <Image
        src="/images/marusan-logo.jpg"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-full ring-1 ring-black/10"
      />
      <span className="font-display text-xl font-extrabold tracking-tight text-tinta">Marusan</span>
    </div>
  );
}
