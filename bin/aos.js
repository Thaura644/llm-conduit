#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0];

const HELP_TEXT = `
aos - Agent Operating System CLI

Usage:
  aos init         Initialize aos in current directory
  aos run <goal>   Run a goal in the executive team
  aos --help       Show this help
`;

if (!command || command === '--help') {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (command === 'init') {
  console.log('Initializing aos...');
  const orgfilePath = path.join(process.cwd(), 'orgfile.yaml');
  if (!fs.existsSync(orgfilePath)) {
    const defaultConfig = `chairman_model: gpt-4o
team:
  CEO:
    model: gpt-4o
    powers: [veto, approve_spend]
    prompt: "You are the CEO. Focus on strategic alignment and risk."
  CTO:
    model: gpt-4o
    powers: [approve_architecture, technical_audit]
    prompt: "You are the CTO. Focus on code quality and scalability."
  PM:
    model: gpt-4o-mini
    powers: [define_scope, set_deadlines]
    prompt: "You are the PM. Focus on efficiency and delivery."
  Dev:
    model: gpt-4o-mini
    powers: [write_code, run_tests]
    prompt: "You are the Dev. Focus on implementation and tools."
`;
    fs.writeFileSync(orgfilePath, defaultConfig);
    console.log('Created orgfile.yaml');
  } else {
    console.log('orgfile.yaml already exists');
  }
} else if (command === 'run') {
  const goal = args.slice(1).join(' ');
  if (!goal) {
    console.error('Error: Goal required');
    process.exit(1);
  }
  console.log(`Running aos with goal: "${goal}"`);
  // In a real implementation, this would call the API or start the engine
  // For now, it will start the dev server and trigger the goal via curl or similar
  console.log('Starting dev server and submitting goal...');
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (e) {
    // Handle interrupt
  }
} else {
  console.error(`Unknown command: ${command}`);
  console.log(HELP_TEXT);
  process.exit(1);
}
