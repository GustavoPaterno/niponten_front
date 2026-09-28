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
    <div className="mt-2 flex flex-col gap-1">
      {menuItems.map((item) => (
        <button
          key={item}
          className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-xs"
        >
          <span>{item}</span>
          <span className="text-red-500">›</span>
        </button>
      ))}
    </div>
  );
}