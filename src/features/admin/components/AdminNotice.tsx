export default function AdminNotice() {
  return (
    <div className="mt-2 rounded-md bg-zinc-800 p-3 text-white">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-red-500">
          ⚠
        </div>

        <div>
          <h2 className="text-sm font-bold">
            AVISO
          </h2>

          <p className="text-[10px] leading-tight">
            Essa área é exclusiva para administradores.
          </p>
        </div>
      </div>
    </div>
  );
}