import Image from "next/image";

export default function BrandHeader() {
  return (
    <div className="flex flex-col items-center justify-center bg-red-500 py-8">
      <Image
        src="/images/home/logo.jpg"
        alt="Logo Marusan"
        width={80}
        height={80}
      />

      <h1 className="mt-3 text-lg font-bold text-white">
        MARUSAN
      </h1>
    </div>
  );
}