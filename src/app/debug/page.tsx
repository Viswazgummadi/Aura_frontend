"use client";

import React, { useEffect, useState } from "react";
import { Terminal, Bug, Play, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

interface LogEntry {
    step: string;
    status: string;
    details: string;
    timestamp: number;
}

interface DiagnoseResult {
    env_api_key_present: boolean;
    active_model_id: string;
    logs: LogEntry[];
    success: boolean;
}

export default function DebugPage() {
    const [diagnostics, setDiagnostics] = useState<DiagnoseResult | null>(null);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const runDiagnostics = async () => {
        setRunning(true);
        setError(null);
        setDiagnostics(null);
        try {
            const res = await fetch("http://localhost:8000/api/v1/debug/diagnose");
            if (!res.ok) throw new Error("Failed to contact debug endpoint");
            const data = await res.json();
            setDiagnostics(data);
        } catch (err) {
            setError(String(err));
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/50">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                        System Diagnostics
                    </h1>
                    <p className="text-sm text-slate-400">Inspect connectivity and configuration health.</p>
                </div>
                <button
                    onClick={runDiagnostics}
                    disabled={running}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all disabled:opacity-50"
                >
                    {running ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />}
                    Run Diagnostics
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                        <XCircle size={20} />
                        <div>
                            <div className="font-semibold">Execution Failed</div>
                            <div className="text-sm opacity-80">{error}</div>
                        </div>
                    </div>
                )}

                {diagnostics && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-xl border ${diagnostics.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <div className="text-sm text-slate-400 mb-1">Overall Status</div>
                                <div className={`text-xl font-bold ${diagnostics.success ? 'text-green-400' : 'text-red-400'}`}>
                                    {diagnostics.success ? "HEALTHY" : "ISSUES FOUND"}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-sm text-slate-400 mb-1">Active Model</div>
                                <div className="text-xl font-bold text-slate-200 truncate">
                                    {diagnostics.active_model_id}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-sm text-slate-400 mb-1">ENV API Key</div>
                                <div className="text-xl font-bold text-slate-200">
                                    {diagnostics.env_api_key_present ? "Present" : "Missing"}
                                </div>
                            </div>
                        </div>

                        {/* Logs Console */}
                        <div className="rounded-2xl bg-[#0d0d12] border border-white/10 overflow-hidden font-mono text-sm shadow-2xl">
                            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/5 text-slate-400">
                                <Terminal size={14} />
                                <span>Execution Log</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {diagnostics.logs.map((log, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="text-slate-600 w-20 shrink-0 text-xs pt-0.5">
                                            {new Date(log.timestamp * 1000).toLocaleTimeString().split(' ')[0]}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <StatusIcon status={log.status} />
                                                <span className="font-semibold text-slate-300">{log.step}</span>
                                            </div>
                                            {log.details && (
                                                <div className="text-slate-500 pl-6 text-xs whitespace-pre-wrap font-sans">
                                                    {log.details}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                )}

                {!diagnostics && !running && !error && (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
                        <Bug size={48} className="opacity-20" />
                        <p>Ready to diagnose. Click Run to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: string }) {
    if (status === "OK" || status === "SUCCESS" || status === "START") return <CheckCircle size={14} className="text-green-500" />;
    if (status === "FAIL" || status === "MISSING" || status === "NOT_FOUND") return <XCircle size={14} className="text-red-500" />;
    return <AlertTriangle size={14} className="text-yellow-500" />;
}
