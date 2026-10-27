import SidebarHeader from "../components/SidebarHeader";
import SidebarModulos from "../components/SidebarModulos";
import SidebarTheme from "../components/SidebarTheme";
import SidebarLogout from "../components/SidebarLogout";

export default function SidebarBuild() {
  return (
    <aside className="flex h-full w-full flex-col bg-white text-black">
      <div className="shrink-0 p-3">
        <SidebarHeader />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3">
        <SidebarModulos />
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 p-3">
        <SidebarTheme />
        <SidebarLogout />
      </div>
    </aside>
  );
}
