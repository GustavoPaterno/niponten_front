
"use client";

import { useSidebar } from "../../../components/SidebarProvider";

export default function AdminHeader() {
  const { openSidebar } = useSidebar();

  return (
    <header className="flex items-center justify-between bg-red-500 px-3 py-2 text-white">
      <button
        type="button"
        onClick={openSidebar}
        aria-label="Abrir menu"
        className="cursor-pointer text-xl"
      >
        ☰
      </button>

      <div className="font-bold">
        MARUSAN
      </div>

      <div className="flex items-center gap-4">
        <span>🛒</span>
        <span className="font-bold">ADM</span>
      </div>
    </header>
  );
}
