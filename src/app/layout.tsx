import "./globals.css";
import Header from "@/src/components/header/Header"

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body>
                <Header />
                {children}
            </body>
        </html>
    );
}