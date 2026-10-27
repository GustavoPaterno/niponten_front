import GuardaDeRota from "@/src/components/auth/GuardaDeRota";

export default function ConfiguracoesLayout({
    children,
}: LayoutProps<"/admin/configuracoes">) {
    return <GuardaDeRota>{children}</GuardaDeRota>;
}
