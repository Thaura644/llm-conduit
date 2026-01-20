const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'records', 'conduit.db');
const db = new Database(dbPath);

console.log('=== Checking Database ===\n');

console.log('1. Team Roles:');
const roles = db.prepare('SELECT role, model FROM team_roles').all();
console.log(roles.length > 0 ? roles : '  No roles configured!');

console.log('\n2. API Keys:');
const keys = db.prepare('SELECT provider FROM api_keys').all();
console.log(keys.length > 0 ? keys : '  No API keys configured!');

console.log('\n3. Recent Events (last 5):');
const events = db.prepare('SELECT type, run_id, timestamp FROM events ORDER BY timestamp DESC LIMIT 5').all();
console.log(events.length > 0 ? events : '  No events logged');

db.close();
