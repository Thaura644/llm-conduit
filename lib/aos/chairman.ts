import OpenAI from 'openai';
import { ConduitEvent, EventLogger, ChairmanVerdictIssuedEvent, AgentProposedEvent } from './events';

export class Chairman {
    private openai: OpenAI;

    constructor(
        private logger: EventLogger,
        apiKey: string,
        private model: string = 'gpt-4o',
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

    async arbitrate(runId: string, context: ConduitEvent[], proposals: AgentProposedEvent[], knowledge: string): Promise<ChairmanVerdictIssuedEvent> {
        const systemPrompt = `# LLM-Conduit | Governance Protocol
The following is an organizational decision window initiated by the Conduit Engine.
Your responsibilities:
1. Conflict Resolution: Weight authority (CEO > CTO > Dev).
2. Consensus Detection: Measure agreement levels.
3. Human Escalation: Escalate if risks are too high or confidence is too low.
4. HUMAN OVERRIDE: If a Human (User) has already voted on a proposal, that vote is FINAL and overrides all agent rules (including CEO veto).

RULES:
- HUMAN VOTE OVERRIDES ALL.
- CEO veto overrides other agents.
- High-risk (>0.8) require high confidence (>0.7) or you must ESCALATE.
- If consensus score > 0.8, APPROVE.
- Weight agent authority: CEO (10) > CTO (8) > PM (6) > Dev (4).

COMPANY KNOWLEDGE:
${knowledge}

You must respond with a JSON verdict following this format:
{
  "verdict": "APPROVE|REJECT|MODIFY|ESCALATE|TERMINATE",
  "authorization": {
    "action": "summary of authorized action",
    "agent": "responsible agent role",
    "conditions": ["list of conditions"],
    "constraints": {}
  },
  "reasoning": {
    "summary": "detailed reasoning",
    "applied_rules": ["rule_ids"],
    "confidence": 0.95,
    "risk_accepted": 0.2
  },
  "audit_trail": {
    "proposals_received": ["list of proposal IDs"],
    "conflicts_detected": ["list of conflicts"],
    "override_used": false
  }
}`;

        const prompt = `Current Context: ${JSON.stringify(context.slice(-10))}
Proposals to Arbitrate: ${JSON.stringify(proposals)}`;

        const chunkId = `chairman-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const stream = await this.openai.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            stream: true,
        });

        let fullContent = '';
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullContent += content;
                this.logger.log({
                    type: 'chairman.thinking',
                    actor: { kind: 'system' },
                    content,
                    chunk_id: chunkId,
                    timestamp: Date.now(),
                    run_id: runId
                });
            }
        }

        if (!fullContent) throw new Error('Chairman failed to respond');

        try {
            const cleanContent = fullContent.match(/\{[\s\S]*\}/)?.[0] || fullContent;
            const verdictData = JSON.parse(cleanContent);

            return {
                type: 'chairman.verdict_issued',
                actor: { kind: 'system' },
                ...verdictData
            } as ChairmanVerdictIssuedEvent;
        } catch (e) {
            console.error('Failed to parse Chairman verdict:', e, fullContent);
            throw new Error('Failed to parse Chairman verdict');
        }
    }
}
