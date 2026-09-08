export default function SidebarTheme() {
  return (
    <div>
      <h2 className="mb-2 text-sm text-red-500">
        Configurações
      </h2>

      <div className="flex items-center justify-between rounded-md bg-gray-100 px-2 py-2 text-xs">
        <span>Tema</span>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            claro
          </span>

          <button className="rounded bg-red-500 px-2 py-1 text-white">
            ☀
          </button>

          <button className="text-gray-600">
            ◐
          </button>
        </div>
      </div>
    </div>
  );
}