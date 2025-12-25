"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, X, Trash2, MapPin, AlignLeft } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import Cookies from "js-cookie";

interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; date?: string };
    end: { dateTime: string; date?: string };
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<any | null>(null);
    const [formData, setFormData] = useState({ title: "", start: "", end: "", desc: "", location: "" });

    // UI State
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helper for Toasts
    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    useEffect(() => {
        fetchEvents();
        // Live Sync Polling (every 10s)
        const interval = setInterval(fetchEvents, 10000);
        return () => clearInterval(interval);
    }, [currentDate]);

    const fetchEvents = async () => {
        const email = Cookies.get("user_email");
        if (!email) { setError("Please connect Google account"); return; }
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8000/api/v1/calendar/events?user_email=${encodeURIComponent(email)}&time_min=${monthStart.toISOString()}&time_max=${monthEnd.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data.map((e: any) => ({
                    id: e.id,
                    title: e.summary || "No Title",
                    date: e.start.dateTime ? parseISO(e.start.dateTime) : new Date(),
                    raw: e
                })));
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handeOpenCreate = () => {
        setEditingEvent(null);
        // Default to today or start of month
        const today = new Date().toISOString().slice(0, 16);
        setFormData({ title: "", start: today, end: today, desc: "", location: "" });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (evt: any) => {
        setEditingEvent(evt);
        const start = evt.raw.start.dateTime ? evt.raw.start.dateTime.slice(0, 16) : "";
        const end = evt.raw.end.dateTime ? evt.raw.end.dateTime.slice(0, 16) : "";
        setFormData({
            title: evt.title,
            start: start,
            end: end,
            desc: evt.raw.description || "",
            location: evt.raw.location || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.title.trim()) {
            showToast("Please enter an event title", "error");
            return;
        }

        const email = Cookies.get("user_email");
        if (!email) return;

        setIsSubmitting(true);
        const payload = {
            summary: formData.title,
            description: formData.desc,
            location: formData.location,
            start_time: new Date(formData.start).toISOString(),
            end_time: new Date(formData.end).toISOString()
        };

        try {
            let url = `http://localhost:8000/api/v1/calendar/events?user_email=${encodeURIComponent(email)}`;
            let method = "POST";

            if (editingEvent) {
                url = `http://localhost:8000/api/v1/calendar/events/${editingEvent.id}?user_email=${encodeURIComponent(email)}`;
                method = "PATCH";
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            setIsModalOpen(false);
            fetchEvents();
            showToast(editingEvent ? "Event updated" : "Event created");
        } catch (e) {
            console.error(e);
            showToast("Failed to save event", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingEvent || !editingEvent.id) {
            showToast("Invalid event ID", "error");
            return;
        }

        if (!confirm("Are you sure you want to delete this event?")) return;

        const email = Cookies.get("user_email");
        if (!email) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`http://localhost:8000/api/v1/calendar/events/${editingEvent.id}?user_email=${encodeURIComponent(email)}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Delete failed");

            setIsModalOpen(false);
            // Optimistically remove from UI
            setEvents(prev => prev.filter(e => e.id !== editingEvent.id));
            fetchEvents(); // Full refresh to be sure
            showToast("Event deleted");
        } catch (e) {
            console.error(e);
            showToast("Failed to delete event", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#191919] text-[#D3D3D3] overflow-y-auto custom-scrollbar font-sans relative">

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cover & Header (Same as before) */}
            <div className="h-48 w-full bg-gradient-to-r from-slate-800 to-stone-800 relative group shrink-0">
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="max-w-[1200px] w-full mx-auto px-12 pb-20 -mt-10 z-10">
                <div className="group mb-8">
                    <div className="text-7xl mb-4 hover:scale-105 transition-transform w-fit cursor-pointer">🏔️</div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span className="flex items-center gap-1"><Clock size={14} /> LIVE SYNC</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white">Long-term Checkpoints</h1>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#2C2C2C]">
                    <div className="flex items-center gap-2">
                        <button className="text-sm font-medium text-white px-2 py-1 rounded hover:bg-[#2C2C2C] flex items-center gap-2">
                            <CalendarIcon size={14} /> Month View
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-[#2C2C2C] rounded" onClick={prevMonth}><ChevronLeft size={18} /></button>
                        <span className="text-sm font-medium min-w-[100px] text-center">{format(currentDate, "MMMM yyyy")}</span>
                        <button className="p-1 hover:bg-[#2C2C2C] rounded" onClick={nextMonth}><ChevronRight size={18} /></button>
                        <button onClick={handeOpenCreate} className="ml-2 bg-[#2eaadc] text-white text-sm font-medium px-3 py-1 rounded hover:bg-[#2597c5]">
                            New
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 border-l border-t border-[#2C2C2C] bg-[#191919]">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                        <div key={d} className="p-2 border-r border-[#2C2C2C] text-xs font-semibold text-gray-500">{d}</div>
                    ))}
                    {calendarDays.map((day, idx) => {
                        const dayEvents = events.filter(e => isSameDay(e.date, day));
                        const isToday = isSameDay(day, new Date());
                        return (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.005 }}
                                key={day.toString()}
                                className={`min-h-[120px] p-2 border-r border-b border-[#2C2C2C] relative group hover:bg-[#202020] transition-colors ${!isSameMonth(day, currentDate) ? "bg-[#1C1C1C]" : ""}`}
                            >
                                <div className={`text-xs mb-2 font-medium flex justify-between ${isToday ? "text-[#EB5757]" : "text-gray-400"}`}>
                                    <span className={isToday ? "bg-[#EB5757]/10 px-1.5 py-0.5 rounded" : ""}>{format(day, "d")}</span>
                                    <button onClick={handeOpenCreate} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-[#2C2C2C] rounded"><Plus size={14} /></button>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {dayEvents.map(evt => (
                                        <div key={evt.id} onClick={() => handleOpenEdit(evt)} className="text-[11px] px-2 py-1 rounded-sm w-full truncate bg-blue-500/20 text-blue-200 cursor-pointer hover:bg-blue-500/30">
                                            {evt.title}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                            className="bg-[#202020] w-[500px] rounded-xl border border-[#303030] shadow-2xl p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Event Title"
                                    className="text-2xl font-bold bg-transparent border-none outline-none text-white placeholder:text-gray-600 w-full"
                                />
                                <div className="flex gap-2">
                                    {editingEvent && (
                                        <button onClick={handleDelete} className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors" title="Delete Event">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[#303030] text-gray-400 rounded-lg">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <Clock size={16} />
                                    <div className="flex gap-2 items-center w-full">
                                        <input type="datetime-local" value={formData.start} onChange={e => setFormData({ ...formData, start: e.target.value })} className="bg-[#151515] rounded px-2 py-1 outline-none text-white flex-1" />
                                        <span>to</span>
                                        <input type="datetime-local" value={formData.end} onChange={e => setFormData({ ...formData, end: e.target.value })} className="bg-[#151515] rounded px-2 py-1 outline-none text-white flex-1" />
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 text-sm text-gray-400">
                                    <MapPin size={16} className="mt-1" />
                                    <input
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="Add location"
                                        className="bg-transparent outline-none text-white w-full border-b border-transparent focus:border-[#444]"
                                    />
                                </div>

                                <div className="flex items-start gap-3 text-sm text-gray-400 pt-2 border-t border-[#303030]">
                                    <AlignLeft size={16} className="mt-1" />
                                    <textarea
                                        value={formData.desc}
                                        onChange={e => setFormData({ ...formData, desc: e.target.value })}
                                        placeholder="Add description..."
                                        className="bg-transparent outline-none text-white w-full h-24 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-4 border-t border-[#303030]">
                                <button
                                    disabled={isSubmitting}
                                    onClick={handleSubmit}
                                    className={`bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? "Saving..." : (editingEvent ? "Save Changes" : "Create Event")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
