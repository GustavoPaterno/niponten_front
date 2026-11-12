import SessaoProvider from "@/src/components/auth/SessaoProvider";
import SidebarProvider from "@/src/components/sidebar/SidebarProvider";
import Header from "@/src/components/header/Header";
import BarraCarrinho from "@/src/components/carrinho/BarraCarrinho";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessaoProvider>
            <SidebarProvider>
                <Header />

                <main className="mt-16 min-h-0 flex-1 bg-chapa p-2 sm:p-4">
                    {children}
                </main>

                <BarraCarrinho />
            </SidebarProvider>
        </SessaoProvider>
    );
}
