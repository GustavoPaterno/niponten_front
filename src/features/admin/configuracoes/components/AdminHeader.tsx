export default function AdminHeader() {
  return (
    <header className="flex items-center justify-between bg-red-500 px-3 py-2 text-white">
      <button className="text-xl">
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