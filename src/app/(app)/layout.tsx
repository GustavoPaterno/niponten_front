import SessaoProvider from "@/src/components/auth/SessaoProvider";
import SidebarProvider from "@/src/components/sidebar/SidebarProvider";
import Header from "@/src/components/header/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessaoProvider>
            <SidebarProvider>
                <Header />

                <main className="flex-1 min-h-0 mt-20 p-2 sm:p-4 bg-[#FFF]">
                    {children}
                </main>
            </SidebarProvider>
        </SessaoProvider>
    );
}
