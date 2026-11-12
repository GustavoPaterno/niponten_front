
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
      <h2 className="mb-2 font-display text-sm font-bold text-tinta-suave">
        Configurações
      </h2>

      <div className="flex w-full items-center justify-between rounded-xl bg-chapa px-3 py-3 text-sm text-tinta">
        <span>Tema</span>

        <div className="flex items-center gap-2">
          <span className="text-tinta-suave">
            {theme === "light" ? "claro" : "escuro"}
          </span>

          <button
            type="button"
            onClick={() => changeTheme("light")}
            aria-label="Ativar tema claro"
            aria-pressed={theme === "light"}
            className={`cursor-pointer rounded px-2 py-1 transition-colors duration-300 ${
              theme === "light"
                ? "bg-marca text-white"
                : "bg-black/10 text-tinta-suave hover:bg-black/20"
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
                ? "bg-marca text-white"
                : "bg-black/10 text-tinta-suave hover:bg-black/20"
            }`}
          >
            ◐
          </button>
        </div>
      </div>
    </div>
  );
}
