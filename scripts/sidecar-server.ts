import http from 'http';
import { ConduitEngine } from '../lib/aos/engine';
import path from 'path';

const PORT = 3001;
// Determine data directory (use home if running in prod)
const projectRoot = process.env.DATABASE_PATH
    ? path.dirname(process.env.DATABASE_PATH)
    : process.cwd();

const engine = ConduitEngine.getInstance(projectRoot);

async function start() {
    console.log('--- Starting LLM Conduit Sidecar ---');
    console.log(`Project Root: ${projectRoot}`);
    await engine.init();
    console.log('Engine Initialized.');

    const server = http.createServer(async (req, res) => {
        // CORS Headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = new URL(req.url!, `http://localhost:${PORT}`);
        const path = url.pathname;

        try {
            if (path === '/events' && req.method === 'GET') {
                // SSE Implementation
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                });

                const onEvent = (event: any) => {
                    res.write(`data: ${JSON.stringify(event)}\n\n`);
                };

                // Send history immediately upon connection
                const history = engine.db.getEvents();
                for (const event of history) {
                    res.write(`data: ${JSON.stringify(event)}\n\n`);
                }

                engine.onEvent(onEvent);
                req.on('close', () => engine.offEvent(onEvent));
                return;
            }

            let body = '';
            req.on('data', chunk => body += chunk);
            await new Promise(resolve => req.on('end', resolve));

            const payload = body ? JSON.parse(body) : {};

            if (path === '/goal' && req.method === 'POST') {
                const runId = await engine.submitGoal(payload.goal);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ runId }));
            }
            else if (path === '/feedback' && req.method === 'POST') {
                await engine.submitFeedback(payload.feedback, payload.runId);
                res.writeHead(200);
                res.end();
            }
            else if (path === '/decision' && req.method === 'POST') {
                await engine.makeDecision(payload.proposalId, payload.decision, payload.reason);
                res.writeHead(200);
                res.end();
            }
            else if (path === '/permissions' && req.method === 'GET') {
                const permissions = Array.from(engine.sessionPermissions);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(permissions));
            }
            else if (path === '/permissions' && req.method === 'POST') {
                engine.grantPermission(payload.path, payload.scope);
                res.writeHead(200);
                res.end();
            }
            else if (path === '/settings' && req.method === 'GET') {
                const autoApprove = engine.db.getSetting('auto_approve') === 'true';
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ autoApprove }));
            }
            else if (path === '/settings' && req.method === 'POST') {
                engine.db.setSetting('auto_approve', payload.autoApprove ? 'true' : 'false');
                res.writeHead(200);
                res.end();
            }
            else if (path === '/records' && req.method === 'GET') {
                const records = engine.db.getRecords();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(records));
            }
            else if (path === '/keys' && req.method === 'GET') {
                const providers = ['openai', 'anthropic', 'google', 'xai', 'openrouter', 'nvidia'];
                const keys = providers.map(p => ({
                    provider: p,
                    hasKey: !!engine.db.getApiKey(p)
                }));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(keys));
            }
            else if (path === '/keys' && req.method === 'POST') {
                engine.db.saveApiKey(payload.provider, payload.key, payload.baseUrl);
                await engine.initializeAgents(); // Reload agents with new key
                res.writeHead(200);
                res.end();
            }
            else if (path === '/sessions' && req.method === 'DELETE') {
                engine.db.deleteSession(payload.runId);
                res.writeHead(200);
                res.end();
            }
            else if (path === '/reload' && req.method === 'POST') {
                await engine.init();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            }
            else if (path === '/test-connection' && req.method === 'POST') {
                try {
                    const { provider, model } = payload;
                    const startTime = Date.now();

                    // Simple connectivity test
                    const credentials = (engine as any).getAgentCredentials(model || (provider === 'openai' ? 'gpt-4o' : 'free'));
                    if (!credentials) throw new Error(`No credentials found for ${provider}`);

                    const testClient = new (require('openai'))({
                        apiKey: credentials.apiKey,
                        baseURL: credentials.baseURL
                    });

                    const response = await testClient.chat.completions.create({
                        model: model || (provider === 'openai' ? 'gpt-4o' : 'free'),
                        messages: [{ role: 'user', content: 'ping' }],
                        max_tokens: 5
                    });

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        latency: `${Date.now() - startTime}ms`,
                        response: response.choices[0].message.content
                    }));
                } catch (err: any) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            }
            else {
                res.writeHead(404);
                res.end();
            }
        } catch (error: any) {
            console.error(`Error handling ${path}:`, error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });

    server.listen(PORT, () => {
        console.log(`Sidecar API running at http://localhost:${PORT}`);
    });
}

start().catch(console.error);
