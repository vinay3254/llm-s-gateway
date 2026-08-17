import React, { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, Sparkles, Copy, Check, ArrowRight } from 'lucide-react';
import { ModelData, GatewayHealth } from '../types';

interface ModelsViewProps {
  models: ModelData[];
  health: GatewayHealth | null;
  onSelectForPlayground: (modelId: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({
  models,
  health,
  onSelectForPlayground,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredModels = models.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.owned_by.toLowerCase().includes(q) ||
      m.aliases?.some((a) => a.toLowerCase().includes(q))
    );
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProviderStatus = (provider: string) => {
    if (provider === 'mock') return { status: 'healthy', label: 'Local Mock' };
    const pHealth = health?.providers?.[provider];
    if (pHealth?.status === 'healthy') return { status: 'healthy', label: 'Key Active' };
    if (pHealth?.status === 'unconfigured') return { status: 'unconfigured', label: 'Key Missing' };
    return { status: 'error', label: pHealth?.message || 'Error' };
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configured Models</h1>
          <p className="page-subtitle">
            Models exposed by the LLM Gateway via <code>/v1/models</code> and router.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search models or aliases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '280px' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={16} />
            Available Models ({filteredModels.length})
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Default Reviewer: <code style={{ color: '#38bdf8' }}>{health?.server?.default_reviewer || 'claude-3-7-sonnet'}</code>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model ID</th>
                <th>Display Name</th>
                <th>Provider</th>
                <th>Aliases</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No models found matching your search.
                  </td>
                </tr>
              ) : (
                filteredModels.map((model) => {
                  const pStatus = getProviderStatus(model.owned_by);
                  const isDefaultReviewer =
                    model.id === health?.server?.default_reviewer ||
                    model.aliases?.includes(health?.server?.default_reviewer || '');

                  return (
                    <tr key={model.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#f8fafc' }}>
                            {model.id}
                          </span>
                          {isDefaultReviewer && (
                            <span className="badge badge-blue" title="Default Reviewer Model">
                              <Sparkles size={11} /> Reviewer
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{model.name}</td>
                      <td>
                        <span
                          className={`badge ${
                            model.owned_by === 'openai'
                              ? 'badge-green'
                              : model.owned_by === 'anthropic'
                              ? 'badge-amber'
                              : 'badge-gray'
                          }`}
                        >
                          {model.owned_by.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {model.aliases && model.aliases.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {model.aliases.map((alias) => (
                              <span key={alias} className="badge badge-gray" style={{ fontSize: '0.65rem' }}>
                                {alias}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        {pStatus.status === 'healthy' ? (
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} /> {pStatus.label}
                          </span>
                        ) : pStatus.status === 'unconfigured' ? (
                          <span className="badge badge-amber">
                            <AlertCircle size={12} /> {pStatus.label}
                          </span>
                        ) : (
                          <span className="badge badge-red">
                            <AlertCircle size={12} /> {pStatus.label}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopy(model.id)}
                            title="Copy Model ID"
                          >
                            {copiedId === model.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onSelectForPlayground(model.id)}
                          >
                            <span>Test</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
