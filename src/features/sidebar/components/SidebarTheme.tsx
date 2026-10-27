
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function SidebarTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("marusan-theme");

    const initialTheme: Theme =
      savedTheme === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle(
      "dark",
      initialTheme === "dark"
    );
  }, []);

  function changeTheme(newTheme: Theme) {
    setTheme(newTheme);

    document.documentElement.classList.toggle(
      "dark",
      newTheme === "dark"
    );

    localStorage.setItem("marusan-theme", newTheme);
  }

  return (
    <div className="w-full">
      <h2 className="mb-2 text-sm text-red-500">
        Configurações
      </h2>

      <div className="flex w-full items-center justify-between rounded-md bg-gray-100 px-3 py-3 text-xs text-black">
        <span>Tema</span>

        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            {theme === "light" ? "claro" : "escuro"}
          </span>

          <button
            type="button"
            onClick={() => changeTheme("light")}
            aria-label="Ativar tema claro"
            aria-pressed={theme === "light"}
            className={`cursor-pointer rounded px-2 py-1 transition-colors duration-300 ${
              theme === "light"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            ☀
          </button>

          <button
            type="button"
            onClick={() => changeTheme("dark")}
            aria-label="Ativar tema escuro"
            aria-pressed={theme === "dark"}
            className={`cursor-pointer rounded px-2 py-1 transition-colors duration-300 ${
              theme === "dark"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            ◐
          </button>
        </div>
      </div>
    </div>
  );
}
