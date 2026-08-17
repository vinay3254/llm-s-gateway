import React, { useState } from 'react';
import { Activity, Clock, CheckCircle2, AlertCircle, Eye, X, Filter } from 'lucide-react';
import { RequestLogItem } from '../types';

interface LogsViewProps {
  logs: RequestLogItem[];
  stats: any;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, stats }) => {
  const [selectedLog, setSelectedLog] = useState<RequestLogItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.model.toLowerCase().includes(q) ||
        l.promptSummary.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gateway Request Logs</h1>
          <p className="page-subtitle">Real-time audit log of completions processed by the gateway.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Requests</span>
          <span className="stat-value">{stats?.totalRequests || logs.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Success Rate</span>
          <span className="stat-value" style={{ color: '#10b981' }}>
            {stats?.totalRequests > 0
              ? `${Math.round((stats.successfulRequests / stats.totalRequests) * 100)}%`
              : '100%'}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg Latency</span>
          <span className="stat-value" style={{ color: '#38bdf8' }}>
            {stats?.avgLatencyMs || 0} ms
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Tokens</span>
          <span className="stat-value">{stats?.totalTokens?.toLocaleString() || 0}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Activity size={16} />
            Recent Requests ({filteredLogs.length})
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Filter prompt or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '220px', padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            />
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Errors</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Status</th>
                <th>Model</th>
                <th>Prompt Summary</th>
                <th>Latency</th>
                <th>Tokens</th>
                <th style={{ textAlign: 'right' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No request logs recorded yet. Send a request or use the Playground/Review tool.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="clickable" onClick={() => setSelectedLog(log)}>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td>
                      {log.status === 'success' ? (
                        <span className="badge badge-green">
                          <CheckCircle2 size={11} /> 200 OK
                        </span>
                      ) : (
                        <span className="badge badge-red">
                          <AlertCircle size={11} /> Error
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{log.model}</span>
                    </td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.promptSummary || '(empty prompt)'}
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        <Clock size={11} /> {log.latencyMs}ms
                      </span>
                    </td>
                    <td>
                      {log.tokens?.total ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {log.tokens.total} <span style={{ color: 'var(--text-muted)' }}>({log.tokens.prompt} in / {log.tokens.completion} out)</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                      >
                        <Eye size={12} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="detail-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Request Inspector</span>
                <span className={`badge ${selectedLog.status === 'success' ? 'badge-green' : 'badge-red'}`}>
                  {selectedLog.status.toUpperCase()}
                </span>
                <span className="badge badge-blue">{selectedLog.model}</span>
                <span className="badge badge-gray">{selectedLog.latencyMs}ms</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedLog(null)}
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            </div>

            <div className="detail-modal-body">
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Messages / Prompt Payload
                </h4>
                {selectedLog.messages.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.25rem' }}>
                      Role: {m.role}
                    </div>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#f1f5f9' }}>
                      {m.content}
                    </pre>
                  </div>
                ))}
              </div>

              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Response Content
                </h4>
                {selectedLog.errorMessage ? (
                  <div
                    style={{
                      backgroundColor: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem',
                      color: '#fb7185',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.825rem',
                    }}
                  >
                    Error: {selectedLog.errorMessage}
                  </div>
                ) : (
                  <pre className="code-block">{selectedLog.responseContent || '(No response content)'}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
