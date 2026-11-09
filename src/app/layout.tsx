import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/src/components/feedback/ToastProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import TemaProvider from "@/src/theme/TemaProvider";

export const metadata: Metadata = {
  title: "Marusan",
  description: "Marusan",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="pt-BR">
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
