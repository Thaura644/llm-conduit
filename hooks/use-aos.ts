"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ConduitEvent } from '@/lib/aos/events';

const IS_TAURI = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__;
// In Tauri, use sidecar. In browser, use sidecar if in dev, else relative (Docker)
const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    (IS_TAURI ? 'http://localhost:3001' : (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : ''));

export function useConduit() {
    const [events, setEvents] = useState<ConduitEvent[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [keys, setKeys] = useState<any[]>([]);
    const [status, setStatus] = useState<'idle' | 'running' | 'error'>('idle');
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [autoApprove, setAutoApprove] = useState(false);

    // Use refs for values needed in SSE to avoid closure staleness
    const activeSessionIdRef = useRef<string | null>(null);
    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    const sessions = useMemo(() => {
        const grouped = events.reduce((acc, event) => {
            if (!event.run_id || event.run_id.startsWith('optimistic-')) return acc;
            if (!acc[event.run_id]) {
                // Find the goal event for this run_id to get proper summary
                const goalEvent = events.find(e => e.run_id === event.run_id && e.type === 'goal.submitted') as any;
                const summary = goalEvent?.goal || goalEvent?.content || `Mission ${event.run_id.slice(0, 8)}`;

                acc[event.run_id] = {
                    id: event.run_id,
                    timestamp: event.timestamp || Date.now(),
                    summary,
                    events: []
                };
            }
            acc[event.run_id].events.push(event);
            return acc;
        }, {} as Record<string, { id: string, timestamp: number, summary: string, events: ConduitEvent[] }>);

        return Object.values(grouped).sort((a, b) => b.timestamp - a.timestamp);
    }, [events]);

    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connect = () => {
            if (eventSource) eventSource.close();
            console.log("Connecting to SSE...");
            eventSource = new EventSource(`${API_BASE}/events`);

            eventSource.onopen = () => {
                console.log("SSE Connected");
                setStatus('idle');
            };

            eventSource.onmessage = (event) => {
                const newEvent = JSON.parse(event.data);
                setEvents((prev) => {
                    // Filter out optimistic events if we get the real one
                    // Optimistic events have temp- prefix
                    if (prev.some(e => e.id && e.id === newEvent.id)) return prev;

                    // If this is a real goal.submitted, remove the 'pending' optimistic one for this goal
                    if (newEvent.type === 'goal.submitted') {
                        return [...prev.filter(e => !e.id?.startsWith('temp-')), newEvent];
                    }

                    return [...prev, newEvent];
                });

                // Status management based on events
                if (['goal.submitted', 'human.feedback', 'chairman.window_opened', 'decision.made'].includes(newEvent.type)) {
                    setStatus('running');
                }
                if (['agent.proposed', 'chairman.verdict_issued', 'agent.message'].includes(newEvent.type)) {
                    setStatus('idle');
                }
            };

            eventSource.onerror = (err) => {
                console.error("SSE Error:", err);
                setStatus('error');
                if (eventSource) eventSource.close();
                // Reconnect after 3 seconds
                reconnectTimeout = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (eventSource) eventSource.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);

    const fetchRecords = useCallback(async () => {
        const res = await fetch(`${API_BASE}/records`);
        const data = await res.json();
        setRecords(data);
    }, []);

    const fetchKeys = useCallback(async () => {
        const res = await fetch(`${API_BASE}/keys`);
        const data = await res.json();
        setKeys(data);
    }, []);

    const fetchSettings = useCallback(async () => {
        const res = await fetch(`${API_BASE}/settings`);
        const data = await res.json();
        setAutoApprove(data.autoApprove);
    }, []);

    useEffect(() => {
        fetchRecords();
        fetchKeys();
        fetchSettings();
    }, [fetchRecords, fetchKeys, fetchSettings]);

    const submitGoal = useCallback(async (goal: string) => {
        setStatus('running');
        // Unique optimistic ID to avoid mixing attempts
        const optimisticId = `optimistic-new-${Date.now()}`;
        const tempEventId = `temp-${Date.now()}`;

        const optimisticEvent = {
            id: tempEventId,
            type: 'goal.submitted',
            goal,
            timestamp: Date.now(),
            actor: { kind: 'human' },
            run_id: optimisticId
        } as any;
        setEvents(prev => [...prev, optimisticEvent]);

        try {
            const res = await fetch(`${API_BASE}/goal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ goal }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to submit goal');

            // Swap to real ID
            setEvents(prev => prev.map(e => e.run_id === optimisticId ? { ...e, run_id: data.runId } : e));
            setActiveSessionId(data.runId);
            return data.runId;
        } catch (error) {
            console.error(error);
            setStatus('error');
            setEvents(prev => prev.filter(e => e.id?.startsWith('optimistic-') ? e.id !== tempEventId : true));
        }
    }, []);

    const makeDecision = useCallback(async (proposalId: string, decision: 'approved' | 'rejected', reason?: string) => {
        try {
            setStatus('running');
            const res = await fetch(`${API_BASE}/decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proposalId, decision, reason }),
            });
            if (!res.ok) throw new Error('Failed to make decision');
        } catch (error) {
            console.error(error);
        }
    }, []);

    const updateRole = async (role: any) => {
        await fetch(`${API_BASE}/org`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(role)
        });
        await fetchRecords();
    };

    const deleteRole = async (role: string) => {
        await fetch(`${API_BASE}/org`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
    };

    const addRecord = async (category: string, content: string) => {
        await fetch(`${API_BASE}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, content })
        });
        await fetchRecords();
    };

    const deleteRecord = async (id: string) => {
        await fetch(`${API_BASE}/records`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        await fetchRecords();
    };

    const updateKey = async (provider: string, key: string, base_url?: string) => {
        await fetch(`${API_BASE}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, key, base_url })
        });
        await fetchKeys();
    };

    const testConnection = async (provider: string, model?: string) => {
        try {
            const res = await fetch(`${API_BASE}/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, model }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Connection Success! Latency: ${data.latency}\nResponse: ${data.response}`);
            } else {
                alert(`Connection Failed: ${data.error}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        }
    };

    const submitFeedbackWithId = useCallback(async (feedback: string, runId?: string) => {
        setStatus('running');
        const tempId = `temp-fb-${Date.now()}`;
        const targetRunId = runId || activeSessionIdRef.current || 'orphaned';

        setEvents(prev => [...prev, {
            id: tempId,
            type: 'human.feedback',
            content: feedback,
            timestamp: Date.now(),
            actor: { kind: 'human' },
            run_id: targetRunId
        } as any]);

        try {
            const res = await fetch(`${API_BASE}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback, runId: targetRunId }),
            });
            if (!res.ok) throw new Error('Failed to submit feedback');
        } catch (error) {
            console.error(error);
            setStatus('error');
            setEvents(prev => prev.filter(e => e.id?.startsWith('optimistic-') ? e.id !== tempId : true));
        }
    }, []);

    const deleteSession = async (runId: string) => {
        await fetch(`${API_BASE}/sessions`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ runId })
        });
        if (activeSessionId === runId) setActiveSessionId(null);
        setEvents(prev => prev.filter(e => e.run_id !== runId));
    };

    const toggleAutoApprove = async () => {
        const newValue = !autoApprove;
        setAutoApprove(newValue);
        await fetch(`${API_BASE}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autoApprove: newValue })
        });
    };

    const grantPermission = async (path: string, status: 'GRANTED' | 'DENIED', scope: 'session' | 'always') => {
        await fetch(`${API_BASE}/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, access_level: 'READ', status, scope })
        });
    };

    const reloadAgents = async () => {
        try {
            const res = await fetch(`${API_BASE}/reload`, {
                method: 'POST',
            });
            const data = await res.json();
            if (!data.success) {
                console.error('Failed to reload agents:', data.error);
            }
            return data.success;
        } catch (error) {
            console.error('Error reloading agents:', error);
            return false;
        }
    };

    return {
        events,
        records,
        keys,
        status,
        sessions,
        activeSessionId,
        autoApprove,
        setActiveSessionId,
        submitGoal,
        makeDecision,
        fetchRecords,
        fetchKeys,
        updateRole,
        deleteRole,
        addRecord,
        deleteRecord,
        updateKey,
        testConnection,
        deleteSession,
        grantPermission,
        toggleAutoApprove,
        submitFeedback: submitFeedbackWithId,
        setStatus,
        reloadAgents
    };
}
