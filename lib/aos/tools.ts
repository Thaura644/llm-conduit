import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BraveMCPClient } from './mcp-client';

const execAsync = promisify(exec);

export class ToolExecutor {
    private braveClient: BraveMCPClient;
    private braveApiKey: string | null = null;

    constructor() {
        this.braveClient = new BraveMCPClient();
    }

    setBraveApiKey(apiKey: string) {
        this.braveApiKey = apiKey;
    }

    async execute(toolName: string, args: Record<string, any>): Promise<any> {
        switch (toolName) {
            case 'read_file':
                return this.readFile(args.path);
            case 'write_file':
                return this.writeFile(args.path, args.content);
            case 'run_shell':
                return this.runShell(args.command);
            case 'brave_web_search':
                return this.braveWebSearch(args.query, args);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async readFile(path: string): Promise<string> {
        return fs.readFileSync(path, 'utf-8');
    }

    private async writeFile(path: string, content: string): Promise<void> {
        fs.writeFileSync(path, content);
    }

    private async runShell(command: string): Promise<{ stdout: string; stderr: string }> {
        return execAsync(command);
    }

    private async braveWebSearch(query: string, options: any = {}): Promise<any> {
        if (!this.braveApiKey) {
            throw new Error('Brave API key not configured. Add it to your orgfile.yaml under api_keys.brave');
        }

        try {
            if (!this.braveClient.isConnected()) {
                await this.braveClient.connect(this.braveApiKey);
            }

            const results = await this.braveClient.search(query, {
                count: options.count || 10,
                offset: options.offset || 0,
                country: options.country || 'us',
                search_lang: options.search_lang || 'en',
                safesearch: options.safesearch || 'moderate'
            });

            return {
                query,
                count: results.length,
                results: results.map((result: any) => ({
                    title: result.title,
                    url: result.url,
                    description: result.description,
                    date: result.date
                }))
            };
        } catch (error: any) {
            console.error('[ToolExecutor] Brave search error:', error.message);
            throw new Error(`Brave search failed: ${error.message}`);
        }
    }

    async cleanup(): Promise<void> {
        if (this.braveClient.isConnected()) {
            await this.braveClient.disconnect();
        }
    }
}
