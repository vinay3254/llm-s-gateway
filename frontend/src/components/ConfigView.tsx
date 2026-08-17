import React from 'react';
import { Settings, Shield, Server, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { GatewayConfigData, GatewayHealth } from '../types';

interface ConfigViewProps {
  config: GatewayConfigData | null;
  health: GatewayHealth | null;
}

export const ConfigView: React.FC<ConfigViewProps> = ({ config, health }) => {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gateway Configuration</h1>
          <p className="page-subtitle">
            Active configuration loaded from <code>config.yaml</code> and environment variables.
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* Left: General & Providers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Server size={16} />
                Server Settings
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Gateway Port:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {config?.server?.port || health?.server?.port || 20128}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Binding Host:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{config?.server?.host || '0.0.0.0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Default Reviewer Model:</span>
                  <span className="badge badge-blue">
                    {config?.default_reviewer || health?.server?.default_reviewer || 'claude-3-7-sonnet'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Cpu size={16} />
                Provider Status & API Keys
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* OpenAI */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>OpenAI</span>
                      <span className="badge badge-gray">{config?.providers?.openai?.models?.length || 0} Models</span>
                    </div>
                    {config?.providers?.openai?.hasApiKey ? (
                      <span className="badge badge-green">
                        <CheckCircle2 size={11} /> API Key Configured
                      </span>
                    ) : (
                      <span className="badge badge-amber">
                        <AlertCircle size={11} /> OPENAI_API_KEY Not Set
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Models: {config?.providers?.openai?.models?.map((m) => m.id).join(', ') || 'gpt-4o, gpt-4o-mini, o3-mini'}
                  </div>
                </div>

                {/* Anthropic */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>Anthropic</span>
                      <span className="badge badge-gray">{config?.providers?.anthropic?.models?.length || 0} Models</span>
                    </div>
                    {config?.providers?.anthropic?.hasApiKey ? (
                      <span className="badge badge-green">
                        <CheckCircle2 size={11} /> API Key Configured
                      </span>
                    ) : (
                      <span className="badge badge-amber">
                        <AlertCircle size={11} /> ANTHROPIC_API_KEY Not Set
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Models: {config?.providers?.anthropic?.models?.map((m) => m.id).join(', ') || 'claude-3-7-sonnet, claude-3-5-haiku'}
                  </div>
                </div>

                {/* Mock Provider */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>Local Mock Simulation</span>
                    </div>
                    <span className="badge badge-green">
                      <CheckCircle2 size={11} /> Always Available
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Models: mock-reviewer, mock-gpt-4o (provides offline testing & instant fallback)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: MCP Registration Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Shield size={16} color="#38bdf8" />
                Register MCP Server with IDEs & Agents
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Add the <code>llm-gateway</code> code reviewer to Antigravity, Claude Code, Cursor, or Cline by registering the stdio command:
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Antigravity / MCP Config (mcpServers.json)
                </h4>
                <pre className="code-block">{`{
  "mcpServers": {
    "llm-gateway-reviewer": {
      "command": "node",
      "args": ["${process.cwd().replace(/\\/g, '/')}/dist/mcp/server.js"]
    }
  }
}`}</pre>
              </div>

              <div>
                <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  CLI Quick Start
                </h4>
                <pre className="code-block">{`# Start REST Server
npm run start

# Run MCP Reviewer Server directly over stdio
npm run mcp`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
