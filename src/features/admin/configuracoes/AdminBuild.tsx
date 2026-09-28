import AdminHeader from "./components/AdminHeader";
import AdminNotice from "./components/AdminNotice";
import AdminMenuList from "./components/AdminMenuList";

export default function AdminBuild() {
  return (
    <main className="min-h-screen bg-gray-200 flex justify-center">
      <section className="w-[280px] min-h-screen bg-white">
        <AdminHeader />

        <div className="px-2 py-2">
          <AdminNotice />
          <AdminMenuList />
        </div>
      </section>
    </main>
  );
}