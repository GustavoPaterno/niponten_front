import SidebarProvider from "@/src/components/sidebar/SidebarProvider";
import Header from "@/src/components/header/Header";

// Layout das telas logadas: só aqui existem o Header e a Sidebar.
// A tela de login (/) fica fora deste grupo, por isso não tem header.
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <Header />

            <main className="flex-1 min-h-0 mt-20 p-2 sm:p-4 bg-[#FFF]">
                {children}
            </main>
        </SidebarProvider>
    );
}
