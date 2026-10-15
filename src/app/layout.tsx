
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SidebarProvider from "../components/SidebarProvider";
import "./globals.css";
import Header from "@/src/components/header/Header";
import { ToastProvider } from "@/src/components/feedback/ToastProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body className="flex flex-col">
                <AppRouterCacheProvider>
                    <Header />

                    <main className="flex-1 min-h-0 mt-20 p-2 sm:p-4 bg-[#FFF]">
                        <ToastProvider>{children}</ToastProvider>
                    </main>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}