import React, { useState } from 'react';
import { Code2, Play, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, ArrowUpRight, History, FileCode } from 'lucide-react';
import { ReviewRecordItem, ModelData } from '../types';
import { runReview } from '../api';

interface ReviewsViewProps {
  reviews: ReviewRecordItem[];
  models: ModelData[];
  onReviewCreated: () => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  reviews,
  models,
  onReviewCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'new'>('history');
  const [selectedReview, setSelectedReview] = useState<ReviewRecordItem | null>(reviews[0] || null);

  // New review form state
  const [code, setCode] = useState(`function processData(items) {
  let res = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].active == true) {
      res.push(items[i].val * 2);
    }
  }
  return res;
}`);
  const [diff, setDiff] = useState('');
  const [context, setContext] = useState('Refactoring utility for TypeScript & immutability.');
  const [focus, setFocus] = useState('Type safety and modern ES6+ idioms');
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await runReview({
        code: code.trim() || undefined,
        diff: diff.trim() || undefined,
        context: context.trim() || undefined,
        focus: focus.trim() || undefined,
        model: selectedModel || undefined,
      });
      setSelectedReview(result);
      setActiveTab('history');
      onReviewCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to execute code review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Code Reviews (MCP & UI)</h1>
          <p className="page-subtitle">
            History and interactive runner for the <code>review_code</code> tool.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={14} />
            <span>Review History ({reviews.length})</span>
          </button>
          <button
            className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('new')}
          >
            <Play size={14} />
            <span>Run New Review</span>
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={16} color="#38bdf8" />
              Trigger Direct Code Review
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Uses the same pipeline as the Antigravity MCP tool
            </span>
          </div>

          <div className="card-body">
            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  color: '#fb7185',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleRunReview}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Reviewer Model (Optional)</label>
                  <select
                    className="form-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="">Default Reviewer (from config.yaml)</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Review Focus</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. security, performance, clean architecture"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Context / File Requirements (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Context about why this code was written or architectural constraints"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Source Code to Review</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '180px' }}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste full source code here..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Git Diff to Review (Optional)</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '180px' }}
                    value={diff}
                    onChange={(e) => setDiff(e.target.value)}
                    placeholder="Paste unified git diff here (+/- lines)..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || (!code.trim() && !diff.trim())}
                  style={{ minWidth: '160px' }}
                >
                  <Sparkles size={14} />
                  <span>{loading ? 'Reviewing Code...' : 'Submit for Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Review List */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <FileCode size={16} />
                Recent Reviews ({reviews.length})
              </div>
            </div>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {reviews.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No reviews recorded yet. Run a review or call the MCP tool from your agent.
                </div>
              ) : (
                reviews.map((rev) => {
                  const isSelected = selectedReview?.id === rev.id;
                  return (
                    <div
                      key={rev.id}
                      onClick={() => setSelectedReview(rev)}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {rev.model}
                        </span>
                        {rev.feedback.score !== undefined && (
                          <span className="badge badge-blue">
                            {rev.feedback.score}/10
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.5rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {rev.feedback.summary}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>{new Date(rev.timestamp).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>{rev.latencyMs}ms</span>
                        {rev.focus && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#38bdf8' }}>Focus: {rev.focus}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Review Details */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Sparkles size={16} color="#38bdf8" />
                Review Feedback Details
              </div>
              {selectedReview?.feedback.score !== undefined && (
                <span className="badge badge-green" style={{ fontSize: '0.85rem', padding: '0.25rem 0.6rem' }}>
                  Score: {selectedReview.feedback.score} / 10
                </span>
              )}
            </div>

            <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {selectedReview ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Executive Summary
                    </h3>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {selectedReview.feedback.summary}
                    </p>
                  </div>

                  {selectedReview.feedback.criticalIssues.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.875rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <AlertCircle size={15} />
                        Critical Issues & Vulnerabilities ({selectedReview.feedback.criticalIssues.length})
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#fecdd3' }}>
                        {selectedReview.feedback.criticalIssues.map((issue, idx) => (
                          <li key={idx} style={{ marginBottom: '0.35rem' }}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedReview.feedback.improvements.length > 0 && (
                    <div
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.875rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={15} />
                        Recommended Improvements ({selectedReview.feedback.improvements.length})
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#fef3c7' }}>
                        {selectedReview.feedback.improvements.map((imp, idx) => (
                          <li key={idx} style={{ marginBottom: '0.35rem' }}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Full Review Output
                    </h3>
                    <pre className="code-block">{selectedReview.feedback.rawMarkdown}</pre>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  Select a review from the left list to view feedback details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
