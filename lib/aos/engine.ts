import { v4 as uuidv4 } from 'uuid';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { ConduitDatabase } from './db';
import { EventLogger, ConduitEvent, AgentProposedEvent } from './events';
import { Agent, AgentConfig } from './agents';
import { Chairman } from './chairman';
import { KnowledgeBase } from './knowledge';
import { ToolExecutor } from './tools';

interface ConduitApiKey {
    provider: string;
    key: string;
    base_url?: string;
}

interface ConduitPermission {
    path: string;
    access_level: string;
    status: 'GRANTED' | 'DENIED' | 'PENDING';
    updated_at: number;
}

export class ConduitEngine {
    private static instance: ConduitEngine;
    public db: ConduitDatabase;
    private logger: EventLogger;
    private eventEmitter: EventEmitter;
    public agents: Agent[] = [];
    private chairman?: Chairman;
    private knowledgeBase: KnowledgeBase;
    private toolExecutor: ToolExecutor;
    private runId: string = '';
    private windowTimeout: NodeJS.Timeout | null = null;
    private pendingProposals: AgentProposedEvent[] = [];
    public sessionPermissions = new Set<string>();

    private constructor(projectRoot: string = process.cwd()) {
        this.db = new ConduitDatabase(projectRoot);
        this.logger = new EventLogger();
        this.eventEmitter = new EventEmitter();
        this.knowledgeBase = new KnowledgeBase(this.db);
        this.toolExecutor = new ToolExecutor();
    }

    static getInstance(projectRoot?: string): ConduitEngine {
        if (!ConduitEngine.instance) {
            ConduitEngine.instance = new ConduitEngine(projectRoot);
        }
        return ConduitEngine.instance;
    }

    async init(configPath?: string) {
        const orgfilePath = configPath || path.join(process.cwd(), 'orgfile.yaml');
        if (fs.existsSync(orgfilePath)) {
            const raw = fs.readFileSync(orgfilePath, 'utf-8');
            const config = yaml.parse(raw);

            // Support both 'team_roles' and 'team' keys
            const teamRoles = config.team_roles || config.team;
            if (teamRoles) {
                // Handle both array format and object format
                if (Array.isArray(teamRoles)) {
                    for (const role of teamRoles) {
                        this.db.saveRole(role);
                    }
                } else {
                    // Object format: { CEO: {...}, CTO: {...} }
                    for (const [roleName, roleData] of Object.entries(teamRoles)) {
                        this.db.saveRole({ role: roleName, ...roleData as any });
                    }
                }
            }

            if (config.api_keys) {
                for (const [provider, data] of Object.entries(config.api_keys)) {
                    const keyData = data as any;
                    this.db.saveApiKey(provider, keyData.key, keyData.base_url);
                }
            }
        }

        await this.initializeAgents();
    }

    async initializeAgents() {
        const roles = this.db.getRoles();
        this.agents = [];

        for (const roleConfig of roles) {
            const credentials = this.getAgentCredentials(roleConfig.model);
            if (credentials) {
                const agent = new Agent(
                    roleConfig as AgentConfig,
                    credentials.apiKey,
                    credentials.baseURL
                );
                this.agents.push(agent);
            }
        }

        const chairmanKey = this.db.getApiKey('openrouter') as ConduitApiKey | undefined;
        if (chairmanKey) {
            this.chairman = new Chairman(
                this.logger,
                chairmanKey.key,
                'gpt-4o',
                chairmanKey.base_url || 'https://openrouter.ai/api/v1'
            );
        }
    }

    private getAgentCredentials(modelId: string): { apiKey: string; baseURL?: string } | null {
        if (modelId.includes('openrouter.ai') || modelId.includes('/') || modelId.includes('free')) {
            const orKey = this.db.getApiKey('openrouter') as ConduitApiKey | undefined;
            if (orKey) return { apiKey: orKey.key, baseURL: orKey.base_url || 'https://openrouter.ai/api/v1' };
        }

        if (modelId.startsWith('gpt-') || modelId.includes('gpt')) {
            const openaiKey = this.db.getApiKey('openai') as ConduitApiKey | undefined;
            if (openaiKey) return { apiKey: openaiKey.key, baseURL: openaiKey.base_url };
            const fallbackKey = this.db.getApiKey('openrouter') as ConduitApiKey | undefined;
            if (fallbackKey) return { apiKey: fallbackKey.key, baseURL: fallbackKey.base_url || 'https://openrouter.ai/api/v1' };
        }

        if (modelId.startsWith('claude-')) {
            const anthropicKey = this.db.getApiKey('anthropic') as ConduitApiKey | undefined;
            if (anthropicKey) return { apiKey: anthropicKey.key, baseURL: anthropicKey.base_url };
        }

        if (modelId.includes('gemini')) {
            const googleKey = this.db.getApiKey('google') as ConduitApiKey | undefined;
            if (googleKey) return { apiKey: googleKey.key, baseURL: googleKey.base_url };
        }

        if (modelId.includes('grok')) {
            const xaiKey = this.db.getApiKey('xai') as ConduitApiKey | undefined;
            if (xaiKey) return { apiKey: xaiKey.key, baseURL: xaiKey.base_url };
        }

        const fallbackKey = this.db.getApiKey('openrouter') as ConduitApiKey | undefined;
        if (fallbackKey) return { apiKey: fallbackKey.key, baseURL: fallbackKey.base_url || 'https://openrouter.ai/api/v1' };

        return null;
    }

    logEvent(event: Partial<ConduitEvent>) {
        const fullEvent = this.logger.log({
            ...event,
            run_id: this.runId,
        } as ConduitEvent);
        this.db.logEvent(fullEvent);
        this.eventEmitter.emit('event', fullEvent);
    }

    on(eventName: string, listener: (...args: any[]) => void) {
        this.eventEmitter.on(eventName, listener);
    }

    onEvent(listener: (event: any) => void) {
        this.eventEmitter.on('event', listener);
    }

    offEvent(listener: (event: any) => void) {
        this.eventEmitter.off('event', listener);
    }

    async submitGoal(goal: string): Promise<string> {
        this.runId = uuidv4();
        this.sessionPermissions.clear();

        this.logEvent({
            type: 'goal.submitted',
            actor: { kind: 'human' },
            goal,
        });

        const context = await this.parseContext(goal);
        const knowledge = await this.knowledgeBase.getKnowledgeContext();

        for (const agent of this.agents) {
            await agent.propose(goal, context, knowledge, (event) => this.logEvent(event));
        }

        this.openDecisionWindow();
        return this.runId;
    }

    async submitFeedback(feedback: string, runId?: string) {
        if (runId) {
            this.runId = runId;
        }

        this.logEvent({
            type: 'human.feedback',
            actor: { kind: 'human' },
            content: feedback,
        });

        const context = await this.parseContext(feedback);
        const knowledge = await this.knowledgeBase.getKnowledgeContext();

        for (const agent of this.agents) {
            await agent.propose(feedback, context, knowledge, (event) => this.logEvent(event));
        }

        this.openDecisionWindow();
    }

    private async parseContext(text: string): Promise<string> {
        const pathPattern = /@([^\s]+)/g;
        const matches = Array.from(text.matchAll(pathPattern));

        if (matches.length === 0) {
            return 'No file context requested.';
        }

        let context = '';
        for (const match of matches) {
            const filePath = match[1];
            const permission = this.db.getPermission(filePath) as ConduitPermission | undefined;

            if (permission?.status === 'GRANTED' || this.sessionPermissions.has(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    context += `\n--- File: ${filePath} ---\n${content}\n`;
                } catch (error) {
                    context += `\n--- File: ${filePath} --- (Error reading: ${error})\n`;
                }
            } else {
                this.logEvent({
                    type: 'permission.requested',
                    actor: { kind: 'system' },
                    tool: 'read_context',
                    args: { path: filePath },
                });
                context += `\n--- File: ${filePath} --- (Permission required)\n`;
            }
        }

        return context;
    }

    private openDecisionWindow(context?: string) {
        this.logEvent({
            type: 'chairman.window_opened',
            actor: { kind: 'system' },
            context: context || 'Decision window opened for agent proposals',
        });

        this.pendingProposals = this.logger.getEvents()
            .filter(e => e.type === 'agent.proposed' && e.run_id === this.runId) as AgentProposedEvent[];

        if (this.windowTimeout) {
            clearTimeout(this.windowTimeout);
        }

        this.windowTimeout = setTimeout(() => {
            this.closeDecisionWindow();
        }, 5000);
    }

    private async closeDecisionWindow() {
        if (!this.chairman || this.pendingProposals.length === 0) {
            console.log('Decision window closed with no proposals or no chairman.');
            this.logEvent({
                type: 'agent.message',
                actor: { kind: 'system' },
                content: 'Decision window closed. Awaiting further team intelligence.'
            });
            return;
        }

        try {
            const knowledge = await this.knowledgeBase.getKnowledgeContext();
            const verdict = await this.chairman.arbitrate(
                this.runId,
                this.logger.getEvents(),
                [...this.pendingProposals],
                knowledge
            );

            this.logEvent(verdict);

            const isAutoApprove = this.db.getSetting('auto_approve') === 'true';

            if (verdict.verdict === 'APPROVE' || (isAutoApprove && verdict.reasoning?.confidence > 0.8)) {
                if (isAutoApprove && verdict.verdict !== 'APPROVE') {
                    this.logEvent({
                        type: 'agent.message',
                        actor: { kind: 'system' },
                        content: `Autonomous Protocol engaged: Auto-approving high-confidence verdict (${(verdict.reasoning?.confidence * 100).toFixed(0)}%)`
                    } as any);
                }
                for (const proposal of this.pendingProposals) {
                    await this.executeProposalActions(proposal.proposal_id);
                }
            }
        } catch (error) {
            console.error('Chairman arbitration error:', error);
        } finally {
            this.pendingProposals = [];
        }
    }

    async makeDecision(proposalId: string, decision: 'approved' | 'rejected', reason?: string) {
        this.logEvent({
            type: 'decision.made',
            actor: { kind: 'human' },
            proposal_id: proposalId,
            decision,
            reason,
        });

        if (decision === 'rejected') {
            const proposal = this.logger.getEvents().find(e => e.type === 'agent.proposed' && e.proposal_id === proposalId) as any;
            this.openDecisionWindow(`Strategic Rejection: User rejected proposal for "${proposal?.summary || 'unknown action'}" with reason: ${reason || 'none'}. Re-strategizing required.`);
        } else if (this.windowTimeout) {
            clearTimeout(this.windowTimeout);
            this.windowTimeout = null;
            await this.closeDecisionWindow();
        } else {
            if (decision === 'approved') {
                await this.executeProposalActions(proposalId);
            }
        }
    }

    private async executeProposalActions(proposalId: string) {
        const proposal = this.logger.getEvents().find(
            (e) => e.type === 'agent.proposed' && e.proposal_id === proposalId
        ) as AgentProposedEvent;

        if (!proposal) {
            console.error(`Proposal ${proposalId} not found`);
            return;
        }

        for (const action of proposal.requested_actions) {
            if (action.tool === 'run_shell') {
                const cmdKey = `cmd:${action.args.command}`;
                const permission = this.db.getPermission(cmdKey) as ConduitPermission | undefined;

                if (permission?.status !== 'GRANTED' && !this.sessionPermissions.has(cmdKey)) {
                    this.logEvent({
                        type: 'permission.requested',
                        actor: { kind: 'system' },
                        tool: 'run_shell',
                        args: action.args,
                    });
                    continue;
                }
            }

            try {
                const result = await this.toolExecutor.execute(action.tool, action.args);
                this.logEvent({
                    type: 'action.executed',
                    actor: { kind: 'system' },
                    tool: action.tool,
                    args: action.args,
                    result,
                });
            } catch (error: any) {
                this.logEvent({
                    type: 'action.executed',
                    actor: { kind: 'system' },
                    tool: action.tool,
                    args: action.args,
                    result: { error: error.message },
                });
            }
        }
    }

    grantPermission(path: string, scope: 'session' | 'always') {
        if (scope === 'always') {
            this.db.setPermission(path, 'READ', 'GRANTED');
        } else {
            this.sessionPermissions.add(path);
        }
    }
}
