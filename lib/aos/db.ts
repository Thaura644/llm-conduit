import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

function getDbPath() {
    // 1. Check environment variable
    if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;

    // 2. Default to home directory for consistency across all modes (Tauri, Dev, Docker)
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.llm-conduit');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    return path.join(configDir, 'conduit.db');
}

export class ConduitDatabase {
    private db: Database.Database;

    constructor(projectRoot: string) {
        const dbPath = getDbPath();
        const dbDir = path.dirname(dbPath);

        // Ensure directory exists
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        console.log(`[Database] Using persistence at: ${dbPath}`);
        this.db = new Database(dbPath);
        this.init();
    }

    private init() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                run_id TEXT,
                type TEXT,
                timestamp INTEGER,
                data TEXT
            );

            CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY,
                category TEXT,
                content TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS team_roles (
                role TEXT PRIMARY KEY,
                model TEXT,
                powers TEXT,
                prompt TEXT,
                tools TEXT
            );

            CREATE TABLE IF NOT EXISTS api_keys (
                provider TEXT PRIMARY KEY,
                key TEXT,
                base_url TEXT
            );

            CREATE TABLE IF NOT EXISTS security_permissions (
                path TEXT PRIMARY KEY,
                access_level TEXT,
                status TEXT,
                updated_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS conduit_settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at INTEGER
            );
        `);
    }

    // Event Log
    logEvent(event: any) {
        const stmt = this.db.prepare('INSERT INTO events (id, run_id, type, timestamp, data) VALUES (?, ?, ?, ?, ?)');
        stmt.run(event.id, event.run_id, event.type, event.timestamp, JSON.stringify(event));
    }

    getEvents(runId?: string) {
        if (runId) {
            return this.db.prepare('SELECT data FROM events WHERE run_id = ? ORDER BY timestamp ASC').all(runId).map((r: any) => JSON.parse(r.data));
        }
        return this.db.prepare('SELECT data FROM events ORDER BY timestamp ASC').all().map((r: any) => JSON.parse(r.data));
    }

    deleteSession(runId: string) {
        this.db.prepare('DELETE FROM events WHERE run_id = ?').run(runId);
    }

    // Company Records
    addRecord(record: { id: string; category: string; content: string }) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO records (id, category, content, updated_at) VALUES (?, ?, ?, ?)');
        stmt.run(record.id, record.category, record.content, new Date().toISOString());
    }

    getRecords() {
        return this.db.prepare('SELECT * FROM records ORDER BY updated_at DESC').all();
    }

    deleteRecord(id: string) {
        this.db.prepare('DELETE FROM records WHERE id = ?').run(id);
    }

    // Team Roles
    saveRole(role: any) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO team_roles (role, model, powers, prompt, tools) VALUES (?, ?, ?, ?, ?)');
        stmt.run(
            role.role,
            role.model,
            JSON.stringify(role.powers || []),
            role.prompt,
            JSON.stringify(role.tools || [])
        );
    }

    getRoles() {
        return this.db.prepare('SELECT * FROM team_roles').all().map((r: any) => ({
            role: r.role,
            model: r.model,
            powers: JSON.parse(r.powers),
            prompt: r.prompt,
            tools: JSON.parse(r.tools)
        }));
    }

    deleteRole(role: string) {
        this.db.prepare('DELETE FROM team_roles WHERE role = ?').run(role);
    }

    // API Keys
    saveApiKey(provider: string, key: string, baseUrl?: string) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO api_keys (provider, key, base_url) VALUES (?, ?, ?)');
        stmt.run(provider, key, baseUrl || null);
    }

    getApiKeys() {
        return this.db.prepare('SELECT * FROM api_keys').all();
    }

    getApiKey(provider: string) {
        return this.db.prepare('SELECT * FROM api_keys WHERE provider = ?').get(provider);
    }

    // Security Permissions
    getPermission(pathStr: string) {
        return this.db.prepare('SELECT * FROM security_permissions WHERE path = ?').get(pathStr);
    }

    setPermission(pathStr: string, accessLevel: string, status: string) {
        const stmt = this.db.prepare('INSERT OR REPLACE INTO security_permissions (path, access_level, status, updated_at) VALUES (?, ?, ?, ?)');
        stmt.run(pathStr, accessLevel, status, Date.now());
    }

    setSetting(key: string, value: string) {
        const stmt = this.db.prepare(`
            INSERT INTO conduit_settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
        `);
        stmt.run(key, value, Date.now());
    }

    getSetting(key: string) {
        const row = this.db.prepare('SELECT value FROM conduit_settings WHERE key = ?').get(key) as any;
        return row?.value;
    }
}
