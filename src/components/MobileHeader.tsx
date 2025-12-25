import { Menu, Sparkles } from "lucide-react";

export default function MobileHeader() {
    return (
        <div className="md:hidden fixed top-0 w-full z-50 h-16 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Sparkles size={18} />
                </div>
                <span className="font-semibold text-sm tracking-wide text-slate-200">Aura</span>
            </div>
            <button className="p-2 text-slate-400 hover:text-white">
                <Menu size={20} />
            </button>
        </div>
    );
}
