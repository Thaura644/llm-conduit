import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ToolExecutor {
    async execute(toolName: string, args: Record<string, any>): Promise<any> {
        switch (toolName) {
            case 'read_file':
                return this.readFile(args.path);
            case 'write_file':
                return this.writeFile(args.path, args.content);
            case 'run_shell':
                return this.runShell(args.command);
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
}
