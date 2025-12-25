
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

interface Option {
    value: string;
    label: string;
}

interface GlassSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    label?: string;
}

export function GlassSelect({ value, onChange, options, placeholder = "Select...", label }: GlassSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.value === value);

    return (
        <div className="w-full space-y-2" ref={containerRef}>
            {label && <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{label}</label>}

            <div className="relative">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isOpen ? 'ring-2 ring-indigo-500/50 bg-white/10' : ''}`}
                >
                    <span className={selectedOption ? "text-slate-200" : "text-slate-500"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown size={18} className="text-slate-400" />
                    </motion.div>
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 w-full mt-2 p-1 rounded-xl bg-[#0a0a0f]/90 backdrop-blur-2xl border border-white/10 shadow-xl shadow-black/50 z-50 overflow-hidden max-h-60 overflow-y-auto"
                        >
                            {options.map((option) => (
                                <motion.button
                                    key={option.value}
                                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-left ${option.value === value ? "text-indigo-400 bg-indigo-500/10" : "text-slate-300"
                                        }`}
                                >
                                    <span>{option.label}</span>
                                    {option.value === value && <Check size={16} />}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
