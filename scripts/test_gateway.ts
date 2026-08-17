import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const PORT = 20130;
const BASE_URL = `http://localhost:${PORT}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path: string, options: any = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  return {
    status: res.status,
    headers: res.headers,
    body: await res.json().catch(() => null),
  };
}

async function runTests() {
  console.log('--- [1] Starting REST Gateway server on port ' + PORT + ' ---');
  const serverProcess = spawn('node', ['dist/server.js'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: String(PORT) },
  });

  serverProcess.stdout?.on('data', (d) => console.log(`[Server stdout] ${d.toString().trim()}`));
  serverProcess.stderr?.on('data', (d) => console.error(`[Server stderr] ${d.toString().trim()}`));

  // Wait for server ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/v1/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await sleep(300);
    }
  }

  if (!ready) {
    console.error('Server failed to start in time.');
    serverProcess.kill();
    process.exit(1);
  }

  try {
    console.log('\n--- [2] Raw Response: GET /v1/health ---');
    const health = await request('/v1/health');
    console.log(JSON.stringify(health.body, null, 2));

    console.log('\n--- [3] Raw Response: GET /v1/models ---');
    const models = await request('/v1/models');
    console.log(JSON.stringify(models.body, null, 2));

    console.log('\n--- [4] Real API Call: POST /v1/chat/completions (claude-sonnet-4-6) ---');
    const compRes = await request('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        messages: [{ role: 'user', content: 'Say "Gateway verification successful" in 5 words or less.' }],
      }),
    });
    console.log('Status:', compRes.status);
    console.log('Raw Completion Response:');
    console.log(JSON.stringify(compRes.body, null, 2));

    console.log('\n--- [5] Raw Response: GET /v1/logs (Sample Log Entry) ---');
    const logsRes = await request('/v1/logs');
    console.log(JSON.stringify(logsRes.body, null, 2));

    console.log('\n--- [6] Real MCP review_code Tool Call (claude-sonnet-4-6) ---');
    await testMcpTool();

    console.log('\n🎉 ALL LIVE VERIFICATION CHECKS COMPLETE!');
  } finally {
    serverProcess.kill();
  }
}

async function testMcpTool() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/mcp/server.js'],
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    const tools = await client.listTools();
    console.log('MCP Tools List:', JSON.stringify(tools.tools, null, 2));

    const result: any = await client.callTool({
      name: 'review_code',
      arguments: {
        code: 'function add(a: number, b: number): number { return a + b; }',
        language: 'typescript',
        instructions: 'Check type correctness and give a brief score.',
        reviewer_model: 'claude-sonnet-4-6',
      },
    });

    console.log('\nMCP review_code Raw Tool Result:');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await client.close();
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
