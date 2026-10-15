
"use client";

export default function SidebarLogout() {
  function handleLogout() {
    alert("Botão Deslogar funcionando! Autenticação ainda não implementada.");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full cursor-pointer items-center justify-between rounded-md bg-red-500 px-3 py-2 text-xs text-white transition-colors duration-200 hover:bg-red-600 active:bg-red-700"
    >
      <span>Deslogar</span>
      <span>›</span>
    </button>
  );
}
