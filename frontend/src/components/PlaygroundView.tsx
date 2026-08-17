import React, { useState } from 'react';
import { Terminal, Send, Sparkles, Clock, Layers, Trash2 } from 'lucide-react';
import { ModelData } from '../types';
import { sendChatCompletion } from '../api';

interface PlaygroundViewProps {
  models: ModelData[];
  initialModel?: string;
  onCompletionDone: () => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  models,
  initialModel,
  onCompletionDone,
}) => {
  const [model, setModel] = useState(initialModel || models[0]?.id || 'claude-3-7-sonnet');
  const [systemPrompt, setSystemPrompt] = useState('You are an expert, concise AI assistant.');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ latencyMs: number; tokens?: any } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = { role: 'user', content: prompt };
    const conversation = [...messages, userMsg];
    const fullMessages = [
      ...(systemPrompt.trim() ? [{ role: 'system', content: systemPrompt.trim() }] : []),
      ...conversation,
    ];

    setMessages(conversation);
    setPrompt('');
    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      const response = await sendChatCompletion({
        model,
        messages: fullMessages,
      });

      const assistantMsg = {
        role: 'assistant',
        content: response.choices?.[0]?.message?.content || '(No response received)',
      };

      setMessages([...conversation, assistantMsg]);
      setMetrics({
        latencyMs: Date.now() - startTime,
        tokens: response.usage,
      });
      onCompletionDone();
    } catch (err: any) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setMetrics(null);
    setError(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Completion Playground</h1>
          <p className="page-subtitle">
            Interactive test workbench to execute chat completions through the LLM Gateway.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={15} color="var(--text-secondary)" />
            <select
              className="form-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: '240px' }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id})
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleClear} title="Clear Conversation">
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: System Prompt & Conversation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Sparkles size={15} color="#38bdf8" />
                System Instructions
              </div>
            </div>
            <div className="card-body" style={{ padding: '0.75rem' }}>
              <textarea
                className="form-textarea"
                style={{ minHeight: '60px', fontSize: '0.85rem' }}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Optional system instructions..."
              />
            </div>
          </div>

          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
            <div className="card-header">
              <div className="card-title">
                <Terminal size={15} />
                Conversation Stream ({messages.length} messages)
              </div>
            </div>

            <div
              className="card-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '420px',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No messages in conversation. Type a prompt below to begin testing.
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                      border: '1px solid ' + (m.role === 'user' ? 'var(--accent-hover)' : 'var(--border-color)'),
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        color: m.role === 'user' ? '#e0f2fe' : '#94a3b8',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {m.role}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: '1.5' }}>
                      {m.content}
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span className="spin" style={{ display: 'inline-block', marginRight: '0.5rem' }}>⟳</span>
                  Routing completion through gateway...
                </div>
              )}
            </div>

            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              {error && (
                <div
                  style={{
                    color: '#fb7185',
                    fontSize: '0.8rem',
                    marginBottom: '0.5rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter a message to send to the gateway..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{ flex: 1 }}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()}>
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Metrics & OpenAI Code Snippet */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Clock size={15} />
                Execution Metrics
              </div>
            </div>
            <div className="card-body">
              {metrics ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Latency:</span>
                    <span className="badge badge-blue">{metrics.latencyMs} ms</span>
                  </div>
                  {metrics.tokens && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Prompt Tokens:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{metrics.tokens.prompt_tokens}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Completion Tokens:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{metrics.tokens.completion_tokens}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Tokens:</span>
                        <span className="badge badge-green">{metrics.tokens.total_tokens}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  Send a message to view live latency and token usage metrics.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Terminal size={15} />
                OpenAI SDK Integration Code
              </div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Any standard OpenAI client can connect to this gateway by overriding <code>baseURL</code>:
              </p>
              <pre className="code-block">{`import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'any-key', // Gateway handles upstream keys
  baseURL: 'http://localhost:20128/v1',
});

const response = await openai.chat.completions.create({
  model: '${model}',
  messages: [{ role: 'user', content: 'Hello!' }],
});`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
