import "./globals.css";
import Header from "@/src/components/header/Header"

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body className="flex flex-col">
                <Header />
                <main className="flex-1 min-h-0 mt-20 p-2 sm:p-4 bg-[#FFF]">
                    {children}
                </main>
            </body>
        </html>
    );
}