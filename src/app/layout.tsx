import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "./main-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Aura",
    description: "Your Premium Personal Assistant",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className + " bg-slate-950 text-white"}>
                <MainLayout>{children}</MainLayout>
            </body>
        </html>
    );
}
