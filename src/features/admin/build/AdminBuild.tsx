import AdminHeader from "../components/AdminHeader";
import AdminNotice from "../components/AdminNotice";
import AdminMenuList from "../components/AdminMenuList";

export default function AdminBuild() {
  return (
    <main className="min-h-screen bg-gray-200">
      <section className="w-full min-h-screen bg-white">
        <AdminHeader />

        <div className="px-4 py-4 md:px-6 lg:px-8">
          <AdminNotice />
          <AdminMenuList />
        </div>
      </section>
    </main>
  );
}