export type Actor = { kind: 'agent'; role: string } | { kind: 'human' } | { kind: 'system' };
export type ActionSpec = { tool: string; args: Record<string, any> };

export interface ConduitEvent {
    type: string;
    actor: Actor;
    id?: string;
    timestamp?: number;
    run_id?: string;
    [key: string]: any;
}

export interface GoalSubmittedEvent extends ConduitEvent {
    type: 'goal.submitted';
    goal: string;
}

export interface AgentProposedEvent extends ConduitEvent {
    type: 'agent.proposed';
    proposal_id: string;
    summary: string;
    justification: string;
    risk: 'low' | 'medium' | 'high';
    confidence: number;
    requested_actions: ActionSpec[];
}

export interface DecisionMadeEvent extends ConduitEvent {
    type: 'decision.made';
    proposal_id: string;
    decision: 'approved' | 'rejected';
    reason?: string;
}

export interface ActionExecutedEvent extends ConduitEvent {
    type: 'action.executed';
    tool: string;
    args: Record<string, any>;
    result: any;
}

export interface ChairmanWindowOpenedEvent extends ConduitEvent {
    type: 'chairman.window_opened';
    context: string;
}

export interface ChairmanVerdictIssuedEvent extends ConduitEvent {
    type: 'chairman.verdict_issued';
    verdict: 'APPROVE' | 'REJECT' | 'MODIFY' | 'ESCALATE' | 'TERMINATE';
    authorization?: {
        action: string;
        agent: string;
        conditions: string[];
        constraints: Record<string, any>;
    };
    reasoning: {
        summary: string;
        applied_rules: string[];
        confidence: number;
        risk_accepted: number;
    };
    audit_trail: {
        proposals_received: string[];
        conflicts_detected: string[];
        override_used: boolean;
    };
}

export interface AgentMessageChunkEvent extends ConduitEvent {
    type: 'agent.message.chunk';
    content: string;
    chunk_id: string;
}

export interface ChairmanThinkingEvent extends ConduitEvent {
    type: 'chairman.thinking';
    content: string;
    chunk_id: string;
}

export class EventLogger {
    private events: ConduitEvent[] = [];

    log(event: ConduitEvent) {
        const enhancedEvent = {
            ...event,
            id: event.id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: event.timestamp || Date.now(),
        };
        this.events.push(enhancedEvent);
        return enhancedEvent;
    }

    getEvents(): ConduitEvent[] {
        return this.events;
    }

    clear() {
        this.events = [];
    }
}
