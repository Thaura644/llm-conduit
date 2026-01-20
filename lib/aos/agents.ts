import OpenAI from 'openai';
import { Actor, ActionSpec, EventLogger } from './events';

export type AgentConfig = {
    role: string;
    model: string;
    powers: string[];
    prompt: string;
    tools: string[];
};

export class Agent {
    private openai: OpenAI;

    constructor(
        public config: AgentConfig,
        apiKey: string,
        baseUrl?: string
    ) {
        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseUrl || 'https://openrouter.ai/api/v1',
            defaultHeaders: {
                'X-Title': 'LLM-Conduit',
            },
        });
    }

    async processEvents(events: any[]): Promise<void> {
        const relevantEvents = events.filter(e => {
            // Logic to decide if this agent should react
            if (e.type === 'goal.submitted') return true;
            if (e.type === 'agent.proposed' && this.config.powers.includes('approve_strategy')) return true;
            if (e.type === 'decision.made' && e.proposal_id && events.find((prev: any) => prev.type === 'agent.proposed' && prev.actor.kind === 'agent' && prev.actor.role === this.config.role)) return true;
            return false;
        });

        // Implement reasoning loop here
        // For MVP, we'll just have a simple reaction logic
    }

    async propose(goal: string, context: string, knowledge: string, logFn: (event: any) => void): Promise<void> {
        try {
            console.log(`[${this.config.role}] Starting proposal for goal:`, goal.slice(0, 50));
            logFn({
                type: 'agent.message',
                actor: { kind: 'agent', role: this.config.role },
                content: `Analyzing Strategic Objective...`,
                timestamp: Date.now()
            });

            const systemPrompt = `${this.config.prompt}\n\nCOMPANY KNOWLEDGE:\n${knowledge}\n\nYou must respond with a JSON proposal following this format:\n{
      "summary": "Short summary",
      "justification": "Why this is needed",
      "risk": "low|medium|high",
      "confidence": 0.0-1.0,
      "requested_actions": [ { "tool": "tool_name", "args": {} } ]
    }`;

            console.log(`[${this.config.role}] Calling API with model:`, this.config.model);
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `The current goal is: ${goal}\n\nContext: ${context}` },
                ],
                response_format: { type: 'json_object' },
            });

            console.log(`[${this.config.role}] Received API response`);
            const content = response.choices[0].message.content;
            if (content) {
                try {
                    const cleanContent = content.match(/\{[\s\S]*\}/)?.[0] || content;
                    const proposal = JSON.parse(cleanContent);
                    console.log(`[${this.config.role}] Parsed proposal successfully`);
                    logFn({
                        type: 'agent.proposed',
                        actor: { kind: 'agent', role: this.config.role },
                        proposal_id: `p-${Date.now()}`,
                        ...proposal,
                    });
                } catch (e) {
                    console.error(`[${this.config.role}] Failed to parse agent proposal:`, e, content);
                    logFn({
                        type: 'agent.message',
                        actor: { kind: 'agent', role: this.config.role },
                        content: `Internal Error: Failed to generate structured proposal. Raw response: ${content}`,
                    });
                }
            } else {
                console.error(`[${this.config.role}] No content in API response`);
            }
        } catch (error: any) {
            console.error(`[${this.config.role}] Error in propose:`, error.message);
            console.error(`[${this.config.role}] Stack:`, error.stack);
            logFn({
                type: 'agent.message',
                actor: { kind: 'agent', role: this.config.role },
                content: `Error: ${error.message}`,
            });
        }
    }
}
