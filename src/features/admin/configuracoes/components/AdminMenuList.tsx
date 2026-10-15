
"use client";

const menuItems = [
  "Usuários e permissões",
  "Produtos",
  "Ingredientes",
  "Combos e promoções",
  "Design do site",
  "Funcionalidades (Feature flag)",
  "Pontos de fidelidade",
];

export default function AdminMenuList() {
  return (
    <div className="mx-auto mt-4 flex w-full max-w-xs flex-col gap-2">
      {menuItems.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => alert(`Você clicou em: ${item}`)}
          className="relative flex w-full cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-center text-sm text-black transition-colors hover:border-red-500 hover:bg-red-50 active:bg-red-100"
        >
          <span>{item}</span>
          <span className="absolute right-4 text-red-500">›</span>
        </button>
      ))}
    </div>
  );
}
