import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
    role: string;
    content: string;
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === "user";
    const isError = role === "error";

    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group`}>
            <div className={`flex gap-4 max-w-3xl w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm border ${isUser
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : isError
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                    {isUser ? <User size={14} strokeWidth={2.5} /> : <Bot size={14} strokeWidth={2.5} />}
                </div>

                {/* Content */}
                <div className={`flex flex-col gap-1 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs font-medium text-slate-500 ml-1">
                        {isUser ? "You" : "Aura"}
                    </span>
                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm transition-all duration-200 ${isUser
                            ? 'bg-input border border-border text-slate-100 rounded-tr-md' // User style (dark grey card)
                            : isError
                                ? 'bg-destructive/10 border border-destructive/20 text-red-200 rounded-tl-md'
                                : 'bg-transparent text-slate-300 rounded-tl-md px-0 py-0' // AI style (transparent, long text)
                        }`}>
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
}
