"use client"

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, Zap, BookOpen, MessageSquare, LayoutDashboard, Terminal, Activity, ChevronRight } from "lucide-react";
import { useConduit } from "@/hooks/use-aos";
import Link from 'next/link';

export default function TeamConsole() {
    const { events, submitGoal } = useConduit();
    const [message, setMessage] = useState('');

    const conversation = events.filter(e => e.type === 'agent.message' || e.type === 'goal.submitted' || e.type === 'agent.proposed' || e.type === 'chairman.verdict_issued');
    const roles = events.filter(e => e.type === 'role.defined') as any[];

    const sendToTeam = () => {
        if (!message.trim()) return;
        submitGoal(message);
        setMessage('');
    };

    const quickActions = [
        { icon: <Zap size={16} />, label: 'Deploy Feature' },
        { icon: <BookOpen size={16} />, label: 'Document' },
        { icon: <Users size={16} />, label: 'Team Meeting' },
    ];

    return (
        <div className="h-screen flex flex-col p-6 bg-[#050608] text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Zap size={22} className="text-white fill-current" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white uppercase italic">Conduit Console</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Sovereign Neutral Interface</p>
                    </div>
                </div>
                <Link href="/">
                    <Button variant="outline" className="rounded-2xl gap-2 font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white">
                        <LayoutDashboard size={18} /> Control Room
                    </Button>
                </Link>
            </div>

            {/* Main Interaction Area */}
            <div className="grid grid-cols-4 gap-6 flex-1 overflow-hidden">
                {/* Left: Agent Status */}
                <Card className="rounded-[2rem] border-white/5 bg-white/[0.02] backdrop-blur-md">
                    <CardContent className="p-8">
                        <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-slate-500">Neural Units</h3>
                        <div className="space-y-6">
                            {roles.map(agent => (
                                <div key={agent.role} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {agent.role[0]}
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-slate-200 uppercase">{agent.role}</div>
                                            <div className="text-[10px] text-slate-600 font-mono tracking-tighter">{agent.model}</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Center: Conversation */}
                <Card className="col-span-2 rounded-[2.5rem] border-white/5 bg-white/[0.01] flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                    <CardContent className="p-8 h-full flex flex-col relative z-10">
                        <ScrollArea className="flex-1 -mx-4 px-4 pb-4">
                            <div className="space-y-6">
                                {conversation.map((msg: any, i) => (
                                    <div
                                        key={i}
                                        className={`flex flex-col ${msg.actor?.kind === 'human'
                                            ? 'items-end'
                                            : 'items-start'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2 px-2">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                                {msg.actor?.kind === 'human' ? 'Authority' : (msg.actor?.role || 'System')}
                                            </span>
                                        </div>
                                        <div
                                            className={`p-5 rounded-3xl max-w-[90%] text-sm leading-relaxed shadow-sm transition-all hover:scale-[1.01] ${msg.actor?.kind === 'human'
                                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10'
                                                : 'bg-white/5 border border-white/5 text-slate-300 rounded-tl-none'
                                                }`}
                                        >
                                            {msg.type === 'goal.submitted' ? msg.goal :
                                                msg.type === 'chairman.verdict_issued' ? (
                                                    <div className="space-y-4">
                                                        <div className="font-black text-[10px] uppercase tracking-[0.25em] text-amber-500 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            Verdict: {msg.verdict}
                                                        </div>
                                                        <div className="font-medium text-slate-200">"{msg.reasoning.summary}"</div>
                                                        <div className="text-[10px] text-slate-600 italic uppercase tracking-wider">Logic: {msg.reasoning.applied_rules.join(' • ')}</div>
                                                    </div>
                                                ) : (msg.content || msg.summary)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="flex gap-4 pt-8 border-t border-white/5 bg-transparent">
                            <Input
                                value={message}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                                onKeyPress={(e: React.KeyboardEvent) => (e.key === 'Enter' && sendToTeam())}
                                placeholder="Universal command input..."
                                className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-6 h-14 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-bold placeholder:text-slate-700"
                            />
                            <Button onClick={sendToTeam} className="rounded-2xl h-14 w-14 p-0 bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-600/20 transition-all active:scale-95">
                                <Send size={24} className="fill-current" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Insights */}
                <Card className="rounded-[2rem] border-white/5 bg-[#0a0b0e] text-white overflow-hidden shadow-2xl">
                    <CardContent className="p-8">
                        <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-slate-500 flex items-center gap-2">
                            Neural Shortcuts
                        </h3>
                        <div className="space-y-4">
                            {[
                                "Structural Audit",
                                "Risk Vector Analysis",
                                "Strategic Summary",
                                "Deployment Protocol",
                            ].map((template, i) => (
                                <Button
                                    key={i}
                                    variant="outline"
                                    className="w-full justify-between text-left h-auto py-5 px-6 rounded-2xl border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:text-indigo-400 hover:border-indigo-500/30 transition-all group"
                                    onClick={() => setMessage(template)}
                                >
                                    <span className="font-black text-xs uppercase tracking-widest text-slate-400 group-hover:text-indigo-400">{template}</span>
                                    <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-500" />
                                </Button>
                            ))}
                        </div>

                        <div className="mt-16 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={12} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Latency Monitor</span>
                            </div>
                            <div className="text-2xl font-black text-slate-300">42ms</div>
                            <div className="text-[10px] text-slate-600 mt-1 uppercase font-bold">Encrypted via RSA-4096</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
