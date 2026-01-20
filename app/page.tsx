"use client"

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Check, X, Play, RotateCcw, Send, Settings, Terminal,
  Activity, BookOpen, Users, Cpu, Shield, Plus, Trash2,
  ChevronRight, Brain, Zap, Globe, Command, Home, Key, ExternalLink, Square, PanelLeftClose
} from "lucide-react";
import { useConduit } from "@/hooks/use-aos";
import { motion, AnimatePresence } from "framer-motion";

const MODELS = [
  // Free Models (Prioritized)
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (Free)', provider: 'openrouter', type: 'Free' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', provider: 'openrouter', type: 'Free' },
  { id: 'mistralai/devstral-2:free', name: 'Mistral Devstral 2 (Free)', provider: 'openrouter', type: 'Free' },
  { id: 'moonshot/kimi-k2:free', name: 'Moonshot Kimi K2 (Free)', provider: 'openrouter', type: 'Free' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B (Free)', provider: 'openrouter', type: 'Free' },
  { id: 'xiaomi/mimo-v2-flash:free', name: 'Xiaomi Mimo v2 (Free)', provider: 'openrouter', type: 'Free' },
  { id: 'z.ai/glm-4.5-air:free', name: 'GLM 4.5 Air (Free)', provider: 'openrouter', type: 'Free' },

  // Premium / Frontier Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', type: 'Premium' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', type: 'Fast' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', type: 'Best' },
  { id: 'anthropic/claude-3.5-sonnet:beta', name: 'Claude 3.5 Sonnet v2', provider: 'anthropic', type: 'Updated' },
  { id: 'google/gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro', provider: 'google', type: 'Thinking' },
  { id: 'x-ai/grok-2-1212', name: 'Grok 2', provider: 'xai', type: 'Current' },
  { id: 'x-ai/grok-3', name: 'Grok 3', provider: 'xai', type: 'Future' },
  { id: 'nvidia/qwen3-coder-480b-a35b-instruct', name: 'Qwen 3 Coder 480B', provider: 'nvidia', type: 'Research' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'alibaba', type: 'Strong' },
  { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek', type: 'Efficient' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'meta', type: 'Massive' },
];

const PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter (Global)', icon: <Globe size={14} />, color: 'indigo' },
  { id: 'nvidia', name: 'NVIDIA AI', icon: <Cpu size={14} />, color: 'emerald' },
  { id: 'openai', name: 'OpenAI', icon: <Cpu size={14} />, color: 'emerald' },
  { id: 'anthropic', name: 'Anthropic', icon: <Brain size={14} />, color: 'orange' },
  { id: 'google', name: 'Google (Gemini)', icon: <Globe size={14} />, color: 'blue' },
  { id: 'xai', name: 'xAI (Grok)', icon: <Zap size={14} />, color: 'slate' },
  { id: 'alibaba', name: 'Alibaba (Qwen)', icon: <Command size={14} />, color: 'purple' },
  { id: 'deepseek', name: 'DeepSeek', icon: <Terminal size={14} />, color: 'blue' },
  { id: 'meta', name: 'Meta (Llama)', icon: <Activity size={14} />, color: 'sky' },
  { id: 'minimax', name: 'Minimax', icon: <Zap size={14} />, color: 'rose' },
  { id: 'blackbox', name: 'Blackbox', icon: <Terminal size={14} />, color: 'indigo' },
];

export default function LLMConduitDashboard() {
  const {
    events, records, keys, submitGoal, makeDecision,
    updateRole, deleteRole, addRecord, deleteRecord, updateKey, submitFeedback, testConnection,
    sessions, activeSessionId, setActiveSessionId, status, deleteSession, setStatus, grantPermission,
    autoApprove, toggleAutoApprove, reloadAgents
  } = useConduit();

  const [inputMessage, setInputMessage] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ops' | 'org' | 'knowledge' | 'keys'>('ops');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [streamingChunks, setStreamingChunks] = useState<Record<string, string>>({});

  // New entry states
  const [editingKey, setEditingKey] = useState<{ provider: string, key: string, base_url: string } | null>(null);

  // Reset selection on session switch
  useEffect(() => {
    setSelectedProposalId(null);
  }, [activeSessionId]);

  const roles = events.filter(e => e.type === 'role.defined').reduce((acc, current) => {
    const index = acc.findIndex((item: any) => item.role === current.role);
    if (index === -1) {
      acc.push(current);
    } else {
      acc[index] = current;
    }
    return acc;
  }, [] as any[]);

  // Accumulate streaming chunks
  useEffect(() => {
    const chunkEvents = events.filter(e => e.type === 'agent.message.chunk' || e.type === 'chairman.thinking');
    const accumulated: Record<string, string> = {};
    chunkEvents.forEach((e: any) => {
      if (!accumulated[e.chunk_id]) accumulated[e.chunk_id] = '';
      accumulated[e.chunk_id] += e.content;
    });
    setStreamingChunks(accumulated);
  }, [events]);

  const timeline = events.filter(e => [
    'goal.submitted', 'agent.proposed', 'decision.made', 'human.feedback',
    'action.executed', 'chairman.window_opened',
    'chairman.verdict_issued', 'permission.requested', 'agent.message',
    'agent.message.chunk', 'chairman.thinking'
  ].includes(e.type) && (
      activeSessionId ? (e.run_id === activeSessionId) : (e.run_id?.startsWith('optimistic-new'))
    )).sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));

  const selectedEvent = events.find(e =>
    (e.type === 'agent.proposed' && e.proposal_id === selectedProposalId) ||
    (e.type === 'chairman.verdict_issued' && e.id === selectedProposalId)
  ) as any;

  return (
    <div className="h-screen flex flex-col bg-[#050608] text-slate-100 font-sans overflow-hidden">
      {/* Top Navigation */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-3xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap size={18} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter uppercase text-slate-400">Conduit</h1>
            <div className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 leading-none mt-0.5 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> COMMAND CENTER
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ops' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('ops')}
          >
            <Activity size={12} className="mr-2" /> Operations
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'org' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('org')}
          >
            <Users size={12} className="mr-2" /> Organization
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'knowledge' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('knowledge')}
          >
            <BookOpen size={12} className="mr-2" /> Knowledge
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'keys' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            onClick={() => setActiveTab('keys')}
          >
            <Key size={12} className="mr-2" /> Key Vault
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[10px] font-bold">
            aos ACTIVE
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'ops' ? (
            <motion.div
              key="ops"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`h-full grid ${isSidebarOpen ? 'grid-cols-[260px_1fr_400px]' : 'grid-cols-[0px_1fr_400px]'} gap-px bg-white/5 transition-all duration-300`}
            >
              {/* Left Sidebar: Sessions */}
              <div className={`bg-[#050608] flex flex-col border-r border-white/5 overflow-hidden ${isSidebarOpen ? 'w-[260px]' : 'w-0'}`}>
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <Button
                    onClick={() => {
                      setActiveSessionId(null);
                      setInputMessage("");
                      setSelectedProposalId(null);
                    }}
                    variant={!activeSessionId ? "default" : "secondary"}
                    className={`w-full justify-start font-black text-xs uppercase tracking-widest h-10 ${!activeSessionId ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                  >
                    <Plus size={14} className="mr-2" /> New Mission
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSessionId(s.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all group ${activeSessionId === s.id ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-500'}`}
                      >
                        <div className="text-[11px] font-bold line-clamp-1 group-hover:text-indigo-400 transition-colors flex-1 pr-2">
                          {s.summary || "Untitled Session"}
                        </div>
                        <Trash2
                          size={12}
                          className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this session log?')) deleteSession(s.id);
                          }}
                        />
                        <div className="text-[9px] font-mono opacity-50 mt-1 uppercase">
                          {new Date(s.timestamp).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Center: Chat Interface */}
              <div className="bg-[#08090b] flex flex-col overflow-hidden relative">
                <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-black/20 backdrop-blur-md z-10">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                      {isSidebarOpen ? <PanelLeftClose size={14} /> : <Home size={14} />}
                    </Button>
                    <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-amber-500 animate-pulse' : status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      {activeSessionId ? (sessions.find(s => s.id === activeSessionId)?.summary || "Mission Activity") : "Fresh Neural Link"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                      <Shield size={12} className={autoApprove ? 'text-indigo-400' : 'text-slate-600'} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Autonomous Mode</span>
                      <button
                        onClick={() => toggleAutoApprove()}
                        className={`w-8 h-4 rounded-full transition-all relative ${autoApprove ? 'bg-indigo-600' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoApprove ? 'left-[18px]' : 'left-[2px]'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-6 py-6 pb-32">
                    {timeline.length > 0 ? timeline.map((item: any) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative flex gap-4 ${item.actor?.kind === 'human' ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black shadow-lg ${item.actor?.kind === 'human' ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-white/10 text-slate-400'
                          }`}>
                          {item.actor?.kind === 'human' ? 'H' : (item.actor?.role?.[0] || 'S')}
                        </div>

                        <div className={`flex flex-col max-w-[80%] ${item.actor?.kind === 'human' ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              {item.actor?.kind === 'human' ? 'Authority' : (item.actor?.role || 'System')} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {item.actor?.kind !== 'human' && (
                              <button
                                onClick={() => setInputMessage(prev => prev + `> "${item.summary || item.content}"\n`)}
                                className="text-[9px] text-indigo-400 hover:text-white uppercase font-bold"
                              >
                                Quote
                              </button>
                            )}
                          </div>

                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${item.actor?.kind === 'human' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-sm'
                            } ${item.type === 'chairman.verdict_issued' ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                            {item.type === 'goal.submitted' ? item.goal :
                              item.type === 'agent.proposed' ? (
                                <div onClick={() => setSelectedProposalId(item.proposal_id)} className="cursor-pointer">
                                  <div className="font-bold mb-1 hover:text-indigo-400 transition-colors">{item.summary}</div>
                                  <div className="text-xs opacity-70 italic">"{item.justification}"</div>
                                </div>
                              ) :
                                item.type === 'chairman.verdict_issued' ? (
                                  <div className="cursor-pointer" onClick={() => setSelectedProposalId(item.id)}>
                                    <div className="font-black text-amber-500 uppercase tracking-wider text-xs mb-2">Verdict: {item.verdict}</div>
                                    <div className="italic opacity-80">"{item.reasoning.summary}"</div>
                                  </div>
                                ) :
                                  item.type === 'agent.message.chunk' || item.type === 'chairman.thinking' ? (
                                    <div className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
                                      {streamingChunks[item.chunk_id] || item.content}
                                      <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse" />
                                    </div>
                                  ) :
                                    item.type === 'permission.requested' ? (
                                      <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
                                          <Shield size={14} /> Permission Required
                                        </div>
                                        <div className="text-slate-300 mb-4">
                                          The system is requesting access to
                                          {item.action?.tool === 'read_context' ? ' read ' : ' execute '}
                                          <span className="text-white font-mono bg-white/10 px-1 rounded mx-1">
                                            {item.action?.tool === 'read_context' ? item.action.args.path : item.action.args.command}
                                          </span>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => grantPermission(item.action?.tool === 'read_context' ? item.action.args.path : (item.action?.key || `cmd:${item.action?.args?.command}`), 'GRANTED', 'session')}
                                            className="h-7 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border-none">
                                            Allow Once
                                          </Button>
                                          <Button size="sm" onClick={() => grantPermission(item.action?.tool === 'read_context' ? item.action.args.path : (item.action?.key || `cmd:${item.action?.args?.command}`), 'GRANTED', 'always')}
                                            className="h-7 text-[10px] bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white border-none">
                                            Allow Always
                                          </Button>
                                          <Button size="sm" onClick={() => grantPermission(item.action?.tool === 'read_context' ? item.action.args.path : (item.action?.key || `cmd:${item.action?.args?.command}`), 'DENIED', 'always')}
                                            className="h-7 text-[10px] bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border-none">
                                            Deny
                                          </Button>
                                        </div>
                                      </div>
                                    ) :
                                      item.type === 'agent.message' ? (
                                        <div className="text-slate-400 italic">
                                          "{item.content}"
                                        </div>
                                      ) :
                                        item.type === 'human.feedback' ? (
                                          <div className="text-slate-200">
                                            {item.content}
                                          </div>
                                        ) : (item.content || item.summary || `[${item.type}]`)}

                            {/* Actions inline */}
                            {item.type === 'agent.proposed' && !timeline.some(e => e.type === 'decision.made' && e.proposal_id === item.proposal_id) && (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                                <Button size="sm" onClick={() => makeDecision(item.proposal_id, 'approved')} className="h-6 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border-none">Approve</Button>
                                <Button size="sm" onClick={() => makeDecision(item.proposal_id, 'rejected')} className="h-6 text-[10px] bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border-none">Reject</Button>
                              </div>
                            )}

                          </div>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="h-[400px] flex flex-col items-center justify-center text-slate-800 gap-4">
                        <Activity size={48} className="opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">No Intelligence Sequenced</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-4 bg-[#050608] border-t border-white/5">
                  <div className="relative">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={async (e) => {
                        if (e.key === 'Enter' && inputMessage.trim()) {
                          const msg = inputMessage;
                          setInputMessage(""); // Optimistic clear
                          if (!activeSessionId) {
                            // New Mission
                            const newRunId = await submitGoal(msg);
                            if (newRunId) setActiveSessionId(newRunId);
                          }
                          else {
                            // Feedback
                            console.log('Submitting feedback:', msg);
                            await submitFeedback(msg, activeSessionId);
                          }
                        }
                      }}
                      placeholder={!activeSessionId ? "Determine Mission Objective..." : "Provide Operational Guidance..."}
                      className="bg-white/5 border-white/10 h-14 pl-5 pr-14 rounded-2xl text-sm w-full focus:ring-0 focus:border-indigo-500 transition-all placeholder:text-slate-600 font-medium"
                    />
                    <div className="absolute right-2 top-2 flex gap-2">
                      {status === 'running' && (
                        <Button
                          className="h-10 w-10 rounded-xl bg-rose-600 hover:bg-rose-500 p-0 shadow-lg shadow-rose-500/20"
                          onClick={() => setStatus('idle')}
                          title="Stop Generation"
                        >
                          <Square size={14} className="fill-current" />
                        </Button>
                      )}
                      <Button
                        className={`h-10 w-10 rounded-xl p-0 shadow-lg transition-all ${status === 'running' ? 'bg-slate-700 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
                        onClick={async () => {
                          if (!inputMessage.trim() || status === 'running') return;
                          const msg = inputMessage;
                          setInputMessage("");
                          if (!activeSessionId) {
                            const newRunId = await submitGoal(msg);
                            if (newRunId) setActiveSessionId(newRunId);
                          }
                          else await submitFeedback(msg, activeSessionId);
                        }}
                        disabled={status === 'running'}
                      >
                        {status === 'running' ? <Activity size={16} className="animate-spin" /> : <Send size={16} />}
                      </Button>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-3 px-2 flex justify-between">
                    <span>{activeSessionId ? "Uplink Active" : "Systems Standby"}</span>
                    <span>Enter to Transmit</span>
                  </div>
                </div>
              </div>

              {/* Inspection Panel */}
              <div className="bg-[#0a0b0e] border-l border-white/5 p-10 flex flex-col overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className={`w-4 h-4 ${status === 'running' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Neural Trace</h2>
                    <div className={`ml-auto px-1.5 py-0.5 rounded text-[8px] font-bold ${status === 'running' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                      {status === 'running' ? 'ACTIVE' : 'IDLE'}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-slate-600 hover:text-white transition-colors" onClick={() => setSelectedProposalId(null)}>
                    <RotateCcw size={18} />
                  </Button>
                </div>

                <div className="flex-1 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {selectedEvent ? (
                      <motion.div
                        key={selectedEvent.id || selectedEvent.proposal_id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="h-full flex flex-col"
                      >
                        <ScrollArea className="flex-1 -mx-4 px-4 pr-6">
                          <div className="space-y-8 pb-10">
                            {/* Summary Section */}
                            <section>
                              <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500/70">Strategic Summary</h3>
                                <div className="h-[1px] flex-1 bg-white/5" />
                              </div>
                              <p className="text-xl font-medium text-slate-200 leading-tight">
                                {selectedEvent.summary || selectedEvent.reasoning?.summary}
                              </p>
                            </section>

                            {/* Justification Section */}
                            <section>
                              <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Justification</h3>
                                <div className="h-[1px] flex-1 bg-white/5" />
                              </div>
                              <p className="text-sm text-slate-400 leading-relaxed italic">
                                {selectedEvent.justification || selectedEvent.reasoning?.summary || "No justification provided."}
                              </p>
                            </section>

                            {/* Intelligence Data Section */}
                            <section>
                              <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intelligence Data</h3>
                                <div className="h-[1px] flex-1 bg-white/5" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                  <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Confidence Score</div>
                                  <div className="text-2xl font-black text-indigo-400">
                                    {((selectedEvent.confidence || selectedEvent.reasoning?.confidence || 0) * 100).toFixed(0)}%
                                  </div>
                                </div>
                                <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                                  <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Threat Level</div>
                                  <div className={`text-2xl font-black uppercase ${selectedEvent.risk === 'high' || selectedEvent.risk_accepted > 0.7 ? 'text-rose-500' : (selectedEvent.risk === 'medium' || selectedEvent.risk_accepted > 0.4) ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {selectedEvent.risk || (selectedEvent.risk_accepted > 0.7 ? "HIGH" : selectedEvent.risk_accepted > 0.4 ? "MEDIUM" : "LOW")}
                                  </div>
                                </div>
                              </div>
                            </section>

                            {/* Proposed Operations Section */}
                            {selectedEvent.requested_actions && (
                              <section>
                                <div className="flex items-center gap-2 mb-4">
                                  <h3 className="text-[10px) font-black uppercase tracking-widest text-slate-500">Proposed Operations</h3>
                                  <div className="h-[1px] flex-1 bg-white/5" />
                                </div>
                                <div className="space-y-2">
                                  {selectedEvent.requested_actions.map((action: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 group hover:border-white/10 transition-colors">
                                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Terminal size={14} className="text-slate-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-white uppercase truncate">{action.tool}</div>
                                        <div className="text-[10px] font-mono text-slate-500 truncate">{JSON.stringify(action.args)}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            )}

                            {/* Applied Rulesets (for Verdicts) */}
                            {selectedEvent.reasoning?.applied_rules && (
                              <section>
                                <div className="flex items-center gap-2 mb-4">
                                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Logic Rulesets Triggered</h3>
                                  <div className="h-[1px] flex-1 bg-white/5" />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {selectedEvent.reasoning.applied_rules.map((rule: string) => (
                                    <Badge key={rule} variant="outline" className="border-white/10 text-slate-500 text-[8px] font-black tracking-widest uppercase px-3 py-1">
                                      {rule}
                                    </Badge>
                                  ))}
                                </div>
                              </section>
                            )}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="telemetry"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col"
                      >
                        <ScrollArea className="flex-1 -mx-4 px-4 pr-6">
                          <div className="space-y-4 font-mono text-[10px] pb-10">
                            {[...events].filter(e => e.run_id === activeSessionId || e.run_id?.startsWith('optimistic-')).slice(-50).map((e, i) => (
                              <motion.div
                                key={e.id || i}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-3 opacity-60 hover:opacity-100 transition-opacity group"
                              >
                                <span className="text-slate-700 shrink-0">{new Date(e.timestamp || Date.now()).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                <span className={`shrink-0 uppercase font-black tracking-tighter w-12 ${e.actor?.kind === 'human' ? 'text-indigo-500' : 'text-slate-500'}`}>
                                  {(e.actor as any)?.role?.[0] || e.actor?.kind?.[0] || 'S'}
                                </span>
                                <span className="text-slate-300 break-all leading-tight">
                                  {e.type === 'agent.message' ? (
                                    <span className="text-emerald-500/80 italic">{e.content}</span>
                                  ) : e.type === 'agent.proposed' ? (
                                    <span className="text-indigo-400">Synchronizing: {e.summary}</span>
                                  ) : e.type === 'chairman.verdict_issued' ? (
                                    <span className="text-amber-500 font-black">Consensus: {e.verdict}</span>
                                  ) : e.type === 'action.executed' ? (
                                    <span className="text-emerald-400">Executed: {e.tool}</span>
                                  ) : (
                                    <span className="opacity-50">[{e.type}] telemetry sequenced</span>
                                  )}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'org' ? (
            <motion.div
              key="org"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full grid grid-cols-[1fr_400px] gap-px bg-white/5"
            >
              <div className="bg-[#050608] p-10 flex flex-col overflow-hidden relative">
                <div className="flex items-center justify-between mb-12 z-10">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight">Organization</h2>
                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-2">{roles.length} Sub-units Operational</p>
                  </div>
                  <Button
                    className="bg-white text-black hover:bg-slate-200 rounded-2xl font-black h-12 px-8 shadow-2xl shadow-white/10 transition-all active:scale-95"
                    onClick={() => {
                      const name = prompt("Enter Unit Name (e.g. Architect):");
                      if (name) {
                        updateRole({
                          role: name,
                          model: "gpt-4o-mini",
                          powers: ["general_operations"],
                          tools: ["read_file"]
                        });
                      }
                    }}
                  >
                    <Plus size={18} className="mr-2" /> CREATE UNIT
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-2 gap-6 pb-32">
                    {roles.map((role) => (
                      <Card key={role.role} className="bg-white/[0.03] border-white/5 border-[1.5px] rounded-[2rem] overflow-hidden hover:bg-white/[0.05] transition-all hover:border-white/10 group">
                        <CardContent className="p-8">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center font-black text-xl shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform text-white">
                                {role.role[0]}
                              </div>
                              <div>
                                <div className="font-black text-white text-lg tracking-tight uppercase">{role.role}</div>
                                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Active Member</div>
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" onClick={() => deleteRole(role.role)}>
                              <Trash2 size={18} />
                            </Button>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3">Model Engine</div>
                              <select
                                value={role.model}
                                onChange={async (e) => {
                                  await updateRole({ ...role, model: e.target.value });
                                  const success = await reloadAgents();
                                  if (success) {
                                    console.log('Agents reloaded with new model:', e.target.value);
                                  }
                                }}
                                className="w-full bg-black/50 border border-white/10 rounded-xl h-11 px-4 text-xs font-black text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer appearance-none uppercase tracking-widest"
                              >
                                {MODELS.map(m => <option key={m.id} value={m.id} className="bg-[#0a0b0e]">{m.name} ({m.provider})</option>)}
                              </select>
                            </div>

                            <div>
                              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-3">Privileges</div>
                              <div className="flex flex-wrap gap-2">
                                {role.powers?.map((power: string) => (
                                  <Badge
                                    key={power}
                                    variant="secondary"
                                    className="bg-white/5 text-slate-400 text-[10px] font-black border-none px-3 h-6 uppercase tracking-tighter hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-all"
                                    onClick={() => {
                                      const newPowers = role.powers.filter((p: string) => p !== power);
                                      updateRole({ ...role, powers: newPowers });
                                    }}
                                  >
                                    {power.replace(/_/g, ' ')}
                                  </Badge>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 border-none"
                                  onClick={() => {
                                    const power = prompt("Enter new power (e.g. git_commit):");
                                    if (power) {
                                      updateRole({ ...role, powers: [...(role.powers || []), power] });
                                    }
                                  }}
                                >
                                  <Plus size={10} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="bg-[#0a0b0e] border-l border-white/5 p-12 flex flex-col overflow-hidden shadow-2xl">
                <div className="flex items-center gap-3 mb-10">
                  <Shield size={16} className="text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 text-center">Security Matrix</h3>
                </div>

                <div className="space-y-8">
                  <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 text-slate-400 text-sm leading-relaxed italic font-medium shadow-inner">
                    "Configure neural pathways and authority weights for individual units to optimize organizational output."
                  </div>

                  <div className="space-y-6 pt-10 border-t border-white/5">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] transition-all">
                      <div className="flex items-center gap-3">
                        <Globe size={16} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Public Access</span>
                      </div>
                      <Badge className="bg-rose-500/10 text-rose-500 border-none text-[9px] font-black uppercase tracking-widest px-2 pr-2.5"><X size={10} className="mr-1" /> RESTRICTED</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] transition-all">
                      <div className="flex items-center gap-3">
                        <Brain size={16} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Auto-Feedback</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase tracking-widest px-2 pr-2.5"><Check size={10} className="mr-1" /> ACTIVE</Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] transition-all">
                      <div className="flex items-center gap-3">
                        <Zap size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Master Governance</span>
                      </div>
                      <Badge className="bg-indigo-500/10 text-indigo-500 border-none text-[9px] font-black uppercase tracking-widest px-2 pr-2.5"><Check size={10} className="mr-1" /> ENFORCED</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'knowledge' ? (
            <motion.div
              key="knowledge"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="h-full flex flex-col bg-[#050608] p-16 overflow-hidden relative"
            >
              <div className="max-w-5xl mx-auto w-full flex flex-col h-full z-10">
                <div className="flex items-center justify-between mb-16">
                  <div>
                    <h2 className="text-5xl font-black tracking-tighter mb-4">Knowledge Hub</h2>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Persistent Grounding Vectors</p>
                  </div>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black h-14 px-10 shadow-2xl shadow-indigo-500/20 transition-all active:scale-95"
                    onClick={() => {
                      const category = prompt("Enter Category (e.g. Strategy):");
                      const content = prompt("Enter Content:");
                      if (category && content) {
                        addRecord(category, content);
                      }
                    }}
                  >
                    <Plus size={20} className="mr-2" /> COMMIT RECORD
                  </Button>
                </div>

                <div className="mb-10 flex gap-4">
                  <Input
                    placeholder="Vector search organizational memories..."
                    className="bg-white/5 border-white/10 rounded-2xl h-12 px-6 text-sm focus:ring-indigo-500/50"
                  />
                  <Button variant="ghost" className="rounded-2xl h-12 px-6 border border-white/10 text-slate-400 font-black hover:text-white">FILTER</Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-6 pb-40">
                    {records.map((record: any) => (
                      <div key={record.id} className="group p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex gap-10 items-start hover:bg-white/[0.04]">
                        <div className="w-16 h-16 rounded-3xl bg-white/[0.03] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform group-hover:bg-indigo-500/5">
                          <Brain size={28} className="text-slate-700 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-[10px] font-black uppercase tracking-widest text-indigo-400 px-4 h-6">
                                {record.category}
                              </Badge>
                              <Badge variant="outline" className="border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-3 h-6">
                                VERIFIED
                              </Badge>
                            </div>
                            <button className="text-slate-800 hover:text-rose-500 transition-all p-2 hover:bg-rose-500/10 rounded-xl" onClick={() => deleteRecord(record.id)}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <p className="text-xl text-slate-300 leading-relaxed font-bold tracking-tight">
                            {record.content}
                          </p>
                          <div className="mt-6 flex items-center gap-4 text-[10px] font-black text-slate-700 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Activity size={12} className="text-indigo-500" /> Grounded to 8 Units</span>
                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                            <span>Sequenced: {new Date(record.updated_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="keys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col bg-[#050608] p-16 overflow-hidden relative"
            >
              <div className="max-w-4xl mx-auto w-full flex flex-col h-full z-10">
                <div className="mb-16">
                  <h2 className="text-5xl font-black tracking-tighter mb-4">Key Vault</h2>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">Credentials & Model Routing</p>
                </div>

                <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-40">
                  {PROVIDERS.map((provider) => {
                    const existingKey = keys.find(k => k.provider === provider.id);
                    return (
                      <Card key={provider.id} className="bg-white/[0.02] border-white/5 rounded-[2rem] p-8 hover:bg-white/[0.04] transition-all group">
                        <div className="flex items-center gap-8">
                          <div className={`w-14 h-14 rounded-2xl bg-${provider.color}-500/10 flex items-center justify-center text-${provider.color}-500 shrink-0`}>
                            {provider.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">{provider.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {existingKey ? (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black px-2 uppercase tracking-widest"><Check size={8} className="mr-1" /> CONFIGURED</Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-500 border-none text-[9px] font-black px-2 uppercase tracking-widest"><Activity size={8} className="mr-1" /> AWAITING KEY</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              placeholder={existingKey ? "••••••••••••••••" : "Enter API Key"}
                              className="bg-black/40 border-white/10 rounded-xl h-11 w-64 text-xs font-mono focus:ring-indigo-500/50"
                              onBlur={(e) => {
                                if (e.target.value) updateKey(provider.id, e.target.value);
                              }}
                            />
                            <Button
                              variant="ghost"
                              className="h-11 px-6 rounded-xl border border-white/10 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest"
                              onClick={() => {
                                const k = prompt(`Enter Base URL for ${provider.name} (optional):`);
                                const key = prompt(`Enter API Key for ${provider.name}:`);
                                if (key) updateKey(provider.id, key, k || undefined);
                              }}
                            >
                              SET
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )
          }
        </AnimatePresence >
      </div >
    </div >
  );
}
