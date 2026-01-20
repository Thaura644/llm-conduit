const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'records', 'conduit.db');
const db = new Database(dbPath);

console.log('--- API KEYS ---');
console.log(db.prepare('SELECT provider, base_url FROM api_keys').all());

console.log('\n--- TEAM ROLES ---');
console.log(db.prepare('SELECT role, model FROM team_roles').all());

console.log('\n--- KNOWLEDGE RECORDS ---');
console.log(db.prepare('SELECT id, category, content FROM records').all());

console.log('\n--- EVENTS (LATEST 5) ---');
console.log(db.prepare('SELECT type, timestamp FROM events ORDER BY timestamp DESC LIMIT 5').all());
