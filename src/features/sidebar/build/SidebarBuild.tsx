import SidebarHeader from "../components/SidebarHeader";
import SidebarPages from "../components/SidebarPages";
import SidebarTheme from "../components/SidebarTheme";
import SidebarLogout from "../components/SidebarLogout";

export default function SidebarBuild() {
  return (
    <aside className="flex min-h-screen w-[165px] flex-col bg-white p-3">
      <SidebarHeader />

      <div className="mt-6">
        <SidebarPages />
      </div>

      <div className="mt-4">
        <SidebarTheme />
      </div>

      <div className="mt-auto">
        <SidebarLogout />
      </div>
    </aside>
  );
}