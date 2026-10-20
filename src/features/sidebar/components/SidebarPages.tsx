"use client";

import { useRouter } from "next/navigation";
import { useSidebar } from "@/src/components/sidebar/SidebarProvider";

const pages = [
  { label: "Ver Produtos", href: "/menu" },
  { label: "Carrinho", detail: "0 itens", href: "/carrinho" },
  { label: "Perfil", href: "/perfil" },
];

export default function SidebarPages() {
  const router = useRouter();
  const { closeSidebar } = useSidebar();

  function handleNavigation(href: string) {
    closeSidebar();
    router.push(href);
  }

  return (
    <div className="w-full">
      <h2 className="mb-3 text-sm font-medium text-red-500">
        Páginas
      </h2>

      <div className="flex w-full flex-col gap-2">
        {pages.map((page) => (
          <button
            key={page.label}
            type="button"
            onClick={() => handleNavigation(page.href)}
            className="flex w-[260px] max-w-none cursor-pointer items-center justify-between rounded-md bg-gray-100 px-4 py-3 text-left text-sm text-black transition-colors duration-200 hover:bg-red-100"          >
            <span>{page.label}</span>

            <div className="flex items-center gap-2">
              {page.detail && (
                <span className="text-[10px] text-gray-500">
                  {page.detail}
                </span>
              )}

              <span className="text-lg text-red-500">›</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
