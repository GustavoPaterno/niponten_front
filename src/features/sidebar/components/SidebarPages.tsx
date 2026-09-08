const pages = [
  { label: "Ver Produtos" },
  { label: "Carrinho", detail: "0 itens" },
  { label: "Perfil" },
];

export default function SidebarPages() {
  return (
    <div>
      <h2 className="mb-2 text-sm text-red-500">
        Páginas
      </h2>

      <div className="flex flex-col gap-1">
        {pages.map((page) => (
          <button
            key={page.label}
            className="flex w-full items-center justify-between rounded-md bg-gray-100 px-2 py-2 text-left text-xs"
          >
            <span>{page.label}</span>

            <div className="flex items-center gap-2">
              {page.detail && (
                <span className="text-[10px] text-gray-500">
                  {page.detail}
                </span>
              )}

              <span className="text-lg">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}