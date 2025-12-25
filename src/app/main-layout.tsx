"use client";

import { Sidebar } from "../components/Sidebar";
import React, { Suspense } from "react";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">
            <Suspense fallback={<div className="w-[80px] h-full bg-slate-950/50 border-r border-white/5" />}>
                <Sidebar />
            </Suspense>
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
