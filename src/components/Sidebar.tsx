"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Settings, Sparkles, Menu, X, Trash2, Check, Zap, Calendar as CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

import Cookies from 'js-cookie';

interface Thread {
    id: string;
    title: string;
}

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userPicture, setUserPicture] = useState<string | null>(null);

    useEffect(() => {
        // Check for cookie on mount and periodically
        const checkAuth = () => {
            const email = Cookies.get('user_email');
            const pic = Cookies.get('user_picture');
            if (email) setUserEmail(email);
            if (pic) setUserPicture(pic);
        };
        checkAuth();
        // Also check URL params if just redirected back
        const params = new URLSearchParams(window.location.search);
        const urlEmail = params.get('email');
        const urlPic = params.get('picture');
        const authStatus = params.get('auth');

        if (authStatus === 'success' && urlEmail) {
            Cookies.set('user_email', urlEmail);
            setUserEmail(urlEmail);
            if (urlPic) {
                Cookies.set('user_picture', urlPic);
                setUserPicture(urlPic);
            }
            // Clean URL
            window.history.replaceState({}, '', '/');
        }
    }, []);
    const springConfig = { type: "spring", stiffness: 300, damping: 25 };

    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const activeThreadId = searchParams.get('threadId');
    const isChatView = pathname === '/';
    const isSettingsView = pathname === '/settings';
    const isDebugView = pathname === '/debug';

    const fetchThreads = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/threads/");
            if (res.ok) {
                const data = await res.json();
                setThreads(data);
            }
        } catch (e) { console.error(e) }
    };

    const deleteThread = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/threads/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setThreads(prev => prev.filter(t => t.id !== id));
                setConfirmDeleteId(null);
                // If we were on this thread, redirect to new chat
                if (activeThreadId === id) {
                    router.push('/');
                }
            }
        } catch (e) {
            console.error("Failed to delete thread", e);
        }
    };

    // Auto-refresh threads periodically or when opening sidebar
    useEffect(() => {
        fetchThreads();
        const interval = setInterval(fetchThreads, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isOpen ? 240 : 80 }}
            transition={springConfig}
            className="h-full glass-panel z-50 flex flex-col relative shrink-0 hidden md:flex rounded-r-3xl overflow-hidden border-r border-white/5 bg-slate-950"
            layout
        >
            {/* Header / Toggle */}
            <div className={`p-4 flex items-center h-20 overflow-hidden`}>
                <motion.button
                    layout
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchThreads(); }}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                >
                    <Menu size={20} />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-2 ml-4 whitespace-nowrap"
                        >
                            <Link href="/" className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Sparkles size={18} />
                                </div>
                                <span className="font-semibold text-lg tracking-wide text-slate-200">Aura</span>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* New Chat Button */}
            <div className="px-3 py-2">
                <Link href="/" className="block">
                    <motion.div
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-slate-200 group overflow-hidden whitespace-nowrap`}
                    >
                        <motion.div layout className="shrink-0 flex items-center justify-center w-5 h-5">
                            <Plus size={20} className="text-indigo-400" />
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="text-sm font-medium"
                                >
                                    New Chat
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Link>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 20, marginBottom: 8 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest overflow-hidden whitespace-nowrap"
                        >
                            Recent
                        </motion.div>
                    )}
                </AnimatePresence>

                {threads.map((thread) => (
                    <motion.div
                        layout
                        key={thread.id}
                        onMouseLeave={() => setConfirmDeleteId(null)}
                        className={`w-full flex items-center gap-2 h-12 rounded-xl transition-colors group relative shrink-0 ${activeThreadId === thread.id && isChatView ? 'bg-indigo-500/10 text-indigo-200' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        {confirmDeleteId === thread.id ? (
                            // Confirmation State
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center w-full justify-between px-2 bg-red-500/10 rounded-xl h-full border border-red-500/20"
                            >
                                <span className="text-xs font-medium text-red-400 whitespace-nowrap">Delete?</span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteThread(thread.id); }}
                                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            // Normal State
                            <>
                                <Link
                                    href={`/?threadId=${thread.id}`}
                                    className="flex-1 flex items-center gap-3 overflow-hidden text-left h-full px-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <motion.div layout className="shrink-0 z-10 flex items-center justify-center w-5 h-5">
                                        <MessageSquare size={18} className={`transition-colors ${activeThreadId === thread.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400'}`} />
                                    </motion.div>
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-sm truncate z-10 w-full"
                                            >
                                                {thread.title || "Untitled Chat"}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>

                                {isOpen && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ scale: 1.1, color: "#EF4444" }}
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(thread.id); }}
                                        className="p-2 opacity-0 group-hover:opacity-100 text-slate-600 transition-all shrink-0 absolute right-1"
                                    >
                                        <Trash2 size={16} />
                                    </motion.button>
                                )}
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Settings & User Footer */}
            <div className="p-3 border-t border-white/5 space-y-2 overflow-hidden">
                <Link href="/calendar" className="block">
                    <motion.div
                        layout
                        whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl text-slate-400 hover:text-slate-200 transition-colors text-left group overflow-hidden whitespace-nowrap relative shrink-0 ${pathname === '/calendar' ? 'bg-white/10 text-white' : ''}`}
                    >
                        <motion.div layout className="shrink-0 z-10 flex items-center justify-center w-5 h-5">
                            <CalendarIcon size={18} className={`group-hover:text-emerald-400 transition-colors ${pathname === '/calendar' ? 'text-emerald-400' : 'text-slate-600'}`} />
                        </motion.div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm truncate z-10"
                                >
                                    Checkpoints
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Link>

                <Link href="/debug" className="block">
                    <motion.div
                        layout
                        whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl text-slate-400 hover:text-slate-200 transition-colors text-left group overflow-hidden whitespace-nowrap relative shrink-0 ${isDebugView ? 'bg-white/10 text-white' : ''}`}
                    >
                        <motion.div layout className="shrink-0 z-10 flex items-center justify-center w-5 h-5">
                            <Zap size={18} className={`group-hover:text-amber-400 transition-colors ${isDebugView ? 'text-amber-400' : 'text-slate-600'}`} />
                        </motion.div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm truncate z-10"
                                >
                                    Diagnostics
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Link>

                <Link href="/settings" className="block">
                    <motion.div
                        layout
                        whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 h-12 rounded-xl text-slate-400 hover:text-slate-200 transition-colors text-left group overflow-hidden whitespace-nowrap relative shrink-0 ${isSettingsView ? 'bg-white/10 text-white' : ''}`}
                    >
                        <motion.div layout className="shrink-0 z-10 flex items-center justify-center w-5 h-5">
                            <Settings size={18} className={`group-hover:text-indigo-400 transition-colors ${isSettingsView ? 'text-indigo-400' : 'text-slate-600'}`} />
                        </motion.div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm truncate z-10"
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Link>

                {userEmail ? (
                    <motion.div
                        layout
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 whitespace-nowrap group/profile`}
                    >
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => window.location.href = "http://localhost:8000/api/v1/auth/login/google"}
                        >
                            <motion.div layout className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20 overflow-hidden bg-slate-800">
                                {userPicture ? (
                                    <img src={userPicture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                                        {userEmail[0].toUpperCase()}
                                    </div>
                                )}
                            </motion.div>
                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col"
                                    >
                                        <span className="text-sm font-medium text-slate-200 truncate max-w-[100px]" title={userEmail}>{userEmail.split('@')[0]}</span>
                                        <span className="text-[10px] text-slate-500">Pro Plan</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {isOpen && (
                            <motion.button
                                whileHover={{ scale: 1.1, color: "#EF4444" }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    Cookies.remove('user_email');
                                    Cookies.remove('user_picture');
                                    setUserEmail(null);
                                    setUserPicture(null);
                                    window.location.href = "/";
                                }}
                                className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover/profile:opacity-100"
                                title="Sign Out"
                            >
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                </div>
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        whileHover={{ scale: 1.02 }}
                        onClick={() => window.location.href = "http://localhost:8000/api/v1/auth/login/google"}
                        className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer whitespace-nowrap`}
                    >
                        <motion.div layout className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shrink-0">
                            G
                        </motion.div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col"
                                >
                                    <span className="text-sm font-medium text-slate-200">Connect Google</span>
                                    <span className="text-[10px] text-slate-500">Enable Gmail/Calendar</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </motion.aside>
    );
}
