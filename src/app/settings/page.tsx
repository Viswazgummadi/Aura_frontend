"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Save, Plus, Trash2, Edit2, RotateCcw, Check, Sparkles, Key, Box, X, Settings } from "lucide-react";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface APIKey {
    id: string;
    key: string;
    name: string;
    description?: string;
    created_at: string;
    last_used?: string;
}

interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    model_id: string;
    context_window: number;
    description: string;
}

interface AppConfig {
    active_model_id: string;
    active_api_key_id: string | null;
    models: ModelConfig[];
    api_keys: APIKey[];
    theme: string;
    system_prompt: string;
    temperature: number;
}

// Simple Modal via Portal
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                {children}
            </div>
        </div>,
        document.body
    );
};

// Input Component
const SafeInput = ({ label, value, onChange, placeholder }: any) => (
    <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
        <input
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all"
        />
    </div>
);

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'models' | 'api' | 'system'>('models');
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [newModel, setNewModel] = useState({ name: "", model_id: "", provider: "Google", context_window: 1000000 });
    const [isAddingModel, setIsAddingModel] = useState(false);
    const [isEditingModel, setIsEditingModel] = useState(false);
    const [editingModelId, setEditingModelId] = useState<string | null>(null);

    // API Key States
    const [isAddingKey, setIsAddingKey] = useState(false);
    const [newKey, setNewKey] = useState({ name: "", key: "" });

    useEffect(() => {
        fetch("http://localhost:8000/api/v1/settings")
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error("Failed to fetch settings", err));
    }, []);

    const saveSettings = async () => {
        if (!config) return;
        try {
            await fetch("http://localhost:8000/api/v1/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (config) saveSettings();
    }, [config]);


    const addModel = async () => {
        if (!config) return;
        const model: ModelConfig = {
            id: newModel.name.toLowerCase().replace(/\s+/g, '-'),
            name: newModel.name,
            provider: newModel.provider,
            model_id: newModel.model_id,
            context_window: newModel.context_window,
            description: "Custom model"
        };

        setConfig({ ...config, models: [...config.models, model] });
        setIsAddingModel(false);
        setNewModel({ name: "", model_id: "", provider: "Google", context_window: 1000000 });
    };

    const startEditModel = (model: ModelConfig) => {
        setNewModel({ ...model }); // Reuse newModel state for editing
        setEditingModelId(model.id);
        setIsEditingModel(true);
    };

    const saveEditedModel = () => {
        if (!config || !editingModelId) return;
        setConfig({
            ...config,
            models: config.models.map(m => m.id === editingModelId ? { ...m, ...newModel, id: editingModelId } : m)
        });
        setIsEditingModel(false);
        setEditingModelId(null);
        setNewModel({ name: "", model_id: "", provider: "Google", context_window: 1000000 });
    };

    const addKey = () => {
        if (!config) return;
        const key: APIKey = {
            id: Math.random().toString(36).substr(2, 9),
            key: newKey.key,
            name: newKey.name,
            created_at: new Date().toISOString()
        };
        const currentKeys = config.api_keys || [];
        setConfig({ ...config, api_keys: [...currentKeys, key] });
        setIsAddingKey(false);
        setNewKey({ name: "", key: "" });
    };

    const deleteAPIKey = (id: string) => {
        if (!config) return;
        setConfig({ ...config, api_keys: (config.api_keys || []).filter(k => k.id !== id) });
    };

    const deleteModel = (id: string) => {
        if (!config) return;
        setConfig({ ...config, models: config.models.filter(m => m.id !== id) });
    };

    const setActiveModel = (id: string) => {
        if (!config) return;
        setConfig({ ...config, active_model_id: id });
    };

    const setActiveAPIKey = (id: string) => {
        if (!config) return;
        setConfig({ ...config, active_api_key_id: id });
    };

    if (!config) return <div className="p-10 text-slate-500">Loading Settings...</div>;

    const tabs = [
        { id: 'models', label: 'Models', icon: Box },
        { id: 'api', label: 'API Keys', icon: Key },
        { id: 'system', label: 'System', icon: Sparkles },
    ];

    return (
        <div className="h-full flex flex-col bg-slate-950/50 text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <Settings className="text-indigo-400" /> Settings
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Manage AI models, API keys, and system preferences.</p>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-64 border-r border-white/5 p-4 space-y-2 hidden md:block">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                        >
                            <tab.icon size={18} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Modals outside conditionals to be safe */}
                    <Modal isOpen={isAddingModel} onClose={() => setIsAddingModel(false)} title="Add New Model">
                        <div className="space-y-4">
                            <SafeInput label="Display Name" value={newModel.name} onChange={(e: any) => setNewModel({ ...newModel, name: e.target.value })} placeholder="e.g. Gemini Pro" />
                            <SafeInput label="Model ID" value={newModel.model_id} onChange={(e: any) => setNewModel({ ...newModel, model_id: e.target.value })} placeholder="e.g. models/gemini-1.5-pro" />
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsAddingModel(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                <button onClick={addModel} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Add Model</button>
                            </div>
                        </div>
                    </Modal>

                    {/* EDIT MODEL MODAL */}
                    <Modal isOpen={isEditingModel} onClose={() => setIsEditingModel(false)} title="Edit Model">
                        <div className="space-y-4">
                            <SafeInput label="Display Name" value={newModel.name} onChange={(e: any) => setNewModel({ ...newModel, name: e.target.value })} placeholder="e.g. Gemini Pro 1.5" />
                            <SafeInput label="Model ID" value={newModel.model_id} onChange={(e: any) => setNewModel({ ...newModel, model_id: e.target.value })} placeholder="e.g. models/gemini-1.5-pro" />
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsEditingModel(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                <button onClick={saveEditedModel} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Save Changes</button>
                            </div>
                        </div>
                    </Modal>

                    {/* ADD KEY MODAL */}
                    <Modal isOpen={isAddingKey} onClose={() => setIsAddingKey(false)} title="Add API Key">
                        <div className="space-y-4">
                            <SafeInput label="Key Name" value={newKey.name} onChange={(e: any) => setNewKey({ ...newKey, name: e.target.value })} placeholder="e.g. Personal Project Key" />
                            <SafeInput label="API Key" value={newKey.key} onChange={(e: any) => setNewKey({ ...newKey, key: e.target.value })} placeholder="AIzaSy..." />
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsAddingKey(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                                <button onClick={addKey} className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">Save Key</button>
                            </div>
                        </div>
                    </Modal>

                    {activeTab === 'models' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Active Model</h2>
                                <button onClick={() => setIsAddingModel(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-medium">
                                    <Plus size={16} /> Add Model
                                </button>
                            </div>

                            <div className="grid gap-4">
                                {config.models.map(model => (
                                    <div key={model.id}
                                        onClick={() => setActiveModel(model.id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${config.active_model_id === model.id ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>

                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-semibold ${config.active_model_id === model.id ? 'text-indigo-200' : 'text-slate-200'}`}>{model.name}</h3>
                                                    {config.active_model_id === model.id && <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-mono">{model.model_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs px-2 py-1 rounded bg-black/20 text-slate-400 border border-white/5">{model.provider}</span>
                                            </div>
                                        </div>

                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); startEditModel(model); }}
                                                className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            {config.active_model_id !== model.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteModel(model.id); }}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Available Keys</h2>
                                <button onClick={() => { setNewKey({ name: "", key: "" }); setIsAddingKey(true); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm font-medium">
                                    <Plus size={16} /> Add Key
                                </button>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-200/80 text-sm">
                                <div className="shrink-0 mt-0.5"><Key size={16} /></div>
                                <p>API Keys are stored locally. Select the key you want the agent to use securely.</p>
                            </div>

                            <div className="space-y-3">
                                {(config.api_keys || []).map(key => (
                                    <div key={key.id}
                                        onClick={() => setActiveAPIKey(key.id)}
                                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${config.active_api_key_id === key.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.active_api_key_id === key.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-slate-400'}`}>
                                                <Key size={16} />
                                            </div>
                                            <div>
                                                <p className={`font-medium ${config.active_api_key_id === key.id ? 'text-emerald-200' : 'text-slate-200'}`}>{key.name || "Unnamed Key"}</p>
                                                <p className="text-xs text-slate-500 font-mono">ID: {key.id.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                        {config.active_api_key_id === key.id && (
                                            <div className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Check size={10} /> Selected
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-400">System Prompt</label>
                                    <textarea
                                        value={config.system_prompt}
                                        onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                                        className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 font-mono text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all resize-none"
                                    />
                                </div>

                                <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-center">
                                    <button onClick={saveSettings} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 mx-auto">
                                        <Save size={18} /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
