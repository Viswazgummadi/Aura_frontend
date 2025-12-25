"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Send, Sparkles, ChevronUp, Bot, User, Check } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import MessageBubble from "../components/MessageBubble";

export const dynamic = 'force-dynamic';

interface Message {
    role: 'user' | 'model';
    content: string;
}

function ChatContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const threadIdParam = searchParams.get('threadId');

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [models, setModels] = useState<any[]>([]);
    const [activeModelId, setActiveModelId] = useState<string>("");
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Settings Fetch
    useEffect(() => {
        fetch("http://localhost:8000/api/v1/settings")
            .then(res => res.json())
            .then(data => {
                setModels(data.models || []);
                setActiveModelId(data.active_model_id || "");
            })
            .catch(err => console.error("Failed to fetch settings", err));
    }, []);

    const handleModelChange = async (modelId: string) => {
        setActiveModelId(modelId);
        setIsModelMenuOpen(false);
        try {
            const res = await fetch("http://localhost:8000/api/v1/settings");
            const data = await res.json();
            await fetch("http://localhost:8000/api/v1/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, active_model_id: modelId })
            });
        } catch (e) {
            console.error("Failed to update active model", e);
        }
    };

    // Track current active thread to handle race conditions
    const latestThreadIdRef = useRef<string | null>(null);

    // 1. Thread Synchronization
    useEffect(() => {
        // Update ref
        latestThreadIdRef.current = threadIdParam;

        // Load data
        if (threadIdParam) {
            fetchHistory(threadIdParam);
        } else {
            setMessages([]); // New Chat
            // Focus immediately for new chat
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [threadIdParam]);

    // 2. Auto-scroll
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 3. Auto-focus (Aggressive)
    useEffect(() => {
        if (!isLoading) {
            const timer = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }
    }, [isLoading, threadIdParam]);


    const fetchHistory = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/v1/threads/${id}`);
            if (res.ok) {
                const data = await res.json();
                // Race condition guard: Ensure we are still on the same thread
                if (latestThreadIdRef.current === id) {
                    setMessages(data.messages.map((msg: any) => ({
                        role: (msg.role === 'user' || msg.role === 'human') ? 'user' : 'model',
                        content: msg.content
                    })));
                }
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            if (latestThreadIdRef.current === id) {
                setIsLoading(false);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setIsLoading(true);

        const currentThreadId = latestThreadIdRef.current; // Capture ID at start

        // Optimistic UI
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const res = await fetch("http://localhost:8000/api/v1/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    thread_id: currentThreadId
                }),
            });

            const data = await res.json();

            // Handle New Chat -> Created Thread transition
            if (!currentThreadId && data.thread_id) {
                // We perform a silent URL update so subsequent messages use this ID
                // Using replace to avoid back-button hell (optional, push might be better for history)
                router.replace(`/?threadId=${data.thread_id}`);
            }

            if (res.ok) {
                // Append response only if we haven't switched threads seriously (basic guard)
                // Note: The router.replace above triggers a re-render eventually, 
                // but for a split second we are in a transitional state.
                // We append to current list to ensure smooth UI.

                setMessages(prev => [...prev, { role: 'model', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: "Error: " + (data.detail || "Request failed") }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: "Error: Connection failed." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const activeModelName = models.find(m => m.id === activeModelId)?.name || "Select Model";

    return (
        <div className="flex flex-col h-full bg-slate-950/50 relative">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
                <div className="w-full max-w-6xl p-4 space-y-6 pb-40">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60 min-h-[50vh]">
                            <Sparkles size={48} className="mb-4 text-indigo-400" />
                            <p className="text-lg font-medium">Aura Online</p>
                            <p className="text-sm">Ready to assist.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <MessageBubble key={idx} role={msg.role} content={msg.content} />
                        ))
                    )}

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start px-2"
                        >
                            <div className="bg-white/5 rounded-2xl p-4 flex gap-2 items-center">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent absolute bottom-0 left-0 right-0 z-10 flex justify-center">
                <div className="w-full max-w-6xl relative group flex flex-col items-start gap-2">

                    {/* Model Selector Pill */}
                    <div className="relative">
                        <button
                            onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-full text-xs font-medium text-slate-300 transition-all backdrop-blur-md"
                        >
                            <Sparkles size={12} className="text-indigo-400" />
                            {activeModelName}
                            <ChevronUp size={12} className={`transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isModelMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 mb-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 flex flex-col"
                                >
                                    <div className="p-2 border-b border-white/5 bg-white/5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">Select Model</p>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        {models.map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => handleModelChange(model.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between group transition-colors ${activeModelId === model.id ? 'bg-indigo-500/10 text-indigo-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <span>{model.name}</span>
                                                {activeModelId === model.id && <Check size={12} className="text-indigo-400" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Checkbox Container for Gradient Border */}
                    <div className="relative w-full group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                        <div className="relative bg-slate-900 rounded-2xl flex items-end p-2 border border-white/10 shadow-2xl">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={`Message ${activeModelName}...`}
                                className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 p-3 max-h-48 min-h-[52px] resize-none focus:outline-none custom-scrollbar"
                                style={{ height: 'auto' }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-3 m-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="w-full text-center mt-1 text-[10px] text-slate-600 flex items-center justify-center gap-1">
                        <span>AI can make mistakes. Check important info.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    return (
        <Suspense fallback={<div className="text-white p-10">Loading Chat...</div>}>
            <ChatContent />
        </Suspense>
    );
}
