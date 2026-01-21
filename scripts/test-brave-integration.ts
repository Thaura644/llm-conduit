import { ConduitEngine } from '../lib/aos/engine';
import { BraveMCPClient } from '../lib/aos/mcp-client';

async function testBraveIntegration() {
  console.log('Testing Brave MCP Integration...\n');

  // Test 1: Check if engine can be initialized with Brave key
  console.log('1. Testing engine initialization...');
  try {
    const engine = ConduitEngine.getInstance();
    await engine.init();
    console.log('✅ Engine initialized successfully');
  } catch (error: any) {
    console.log('❌ Engine initialization failed:', error.message);
    return;
  }

  // Test 2: Test Brave MCP client directly
  console.log('\n2. Testing Brave MCP client...');
  const client = new BraveMCPClient();
  
  try {
    // Note: This will fail without a real API key, but tests the connection logic
    await client.connect('test-key');
    console.log('❌ Expected failure with invalid key');
  } catch (error: any) {
    console.log('✅ Correctly handles invalid API key:', error.message);
  }

  // Test 3: Test tool executor with brave search
  console.log('\n3. Testing tool executor...');
  const { ToolExecutor } = await import('../lib/aos/tools');
  const executor = new ToolExecutor();
  
  // Set a mock API key to test the flow
  executor.setBraveApiKey('test-key');
  
  try {
    await executor.execute('brave_web_search', { query: 'test query' });
    console.log('❌ Expected failure with mock key');
  } catch (error: any) {
    console.log('✅ Tool executor correctly handles search errors:', error.message);
  }

  console.log('\n🎉 Brave MCP integration tests completed!');
  console.log('\nTo use the integration:');
  console.log('1. Get a Brave Search API key from https://brave.com/search/api/');
  console.log('2. Update orgfile.yaml with your API key');
  console.log('3. Restart the application');
  console.log('4. Agents can now use web search in their proposals');
}

testBraveIntegration().catch(console.error);