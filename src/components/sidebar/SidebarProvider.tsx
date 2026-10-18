
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import SidebarBuild from "@/src/features/sidebar/build/SidebarBuild";

type SidebarContextType = {
  openSidebar: () => void;
  closeSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar deve ser usado dentro do SidebarProvider");
  }

  return context;
}

export default function SidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        openSidebar: () => setIsOpen(true),
        closeSidebar: () => setIsOpen(false),
      }}
    >
      {children}

      {/* Sidebar lateral */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[300px] transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        inert={!isOpen}
      >
        <div className="relative h-full">
          <SidebarBuild />

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar menu"
            className="absolute right-3 top-3 z-10 cursor-pointer text-xl text-black"
          >
            ×
          </button>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
