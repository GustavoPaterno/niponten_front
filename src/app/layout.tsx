import type { Metadata } from "next";
import { Bricolage_Grotesque, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/src/components/feedback/ToastProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import TemaProvider from "@/src/theme/TemaProvider";

// Títulos, preços e botões: grotesca larga e pesada, com cara de placa de lanchonete.
const display = Bricolage_Grotesque({
    subsets: ["latin"],
    weight: ["600", "700", "800"],
    variable: "--fonte-display",
});

// Texto corrido: gótica japonesa com latim limpo, combina com a origem da casa.
const corpo = Zen_Kaku_Gothic_New({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--fonte-corpo",
});

export const metadata: Metadata = {
    title: "Marusan Pastelaria",
    description:
        "Peça pastéis, pizzas, chapeado e cachorro quente da Marusan, na Ilha da Figueira em Jaraguá do Sul.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
            <body className="min-h-full flex flex-col">
                <AppRouterCacheProvider>
                    <TemaProvider>
                        <ToastProvider>
                            {children}
                        </ToastProvider>
                    </TemaProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
