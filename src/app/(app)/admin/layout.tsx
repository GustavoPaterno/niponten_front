import GuardaDeRota from "@/src/components/auth/GuardaDeRota";

// Toda a área /admin (pedidos, histórico e configurações) passa pela checagem de login e permissão.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
    return <GuardaDeRota>{children}</GuardaDeRota>;
}
