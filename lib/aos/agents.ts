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

            const chunkId = `chunk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
            const stream = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `The current goal is: ${goal}\n\nContext: ${context}` },
                ],
                response_format: { type: 'json_object' },
                stream: true,
            });

            let fullContent = '';
            console.log(`[${this.config.role}] Streaming response...`);

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    logFn({
                        type: 'agent.message.chunk',
                        actor: { kind: 'agent', role: this.config.role },
                        content,
                        chunk_id: chunkId,
                        timestamp: Date.now()
                    });
                }
            }

            console.log(`[${this.config.role}] Stream complete, parsing proposal`);
            if (fullContent) {
                try {
                    const cleanContent = fullContent.match(/\{[\s\S]*\}/)?.[0] || fullContent;
                    const proposal = JSON.parse(cleanContent);
                    console.log(`[${this.config.role}] Parsed proposal successfully`);
                    logFn({
                        type: 'agent.proposed',
                        actor: { kind: 'agent', role: this.config.role },
                        proposal_id: `p-${Date.now()}`,
                        ...proposal,
                    });
                } catch (e) {
                    console.error(`[${this.config.role}] Failed to parse agent proposal:`, e, fullContent);
                    logFn({
                        type: 'agent.message',
                        actor: { kind: 'agent', role: this.config.role },
                        content: `Internal Error: Failed to generate structured proposal. Raw response: ${fullContent}`,
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
