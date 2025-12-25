
import React from "react";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    placeholder?: string;
}

export function GlassInput({ label, className = "", ...props }: GlassInputProps) {
    return (
        <div className="w-full space-y-2">
            {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{label}</label>}
            <input
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all ${className}`}
                {...props}
            />
        </div>
    );
}
