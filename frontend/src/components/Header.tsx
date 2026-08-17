import React from 'react';
import { Layers, Activity, FileText, Code2, Settings, Terminal, RefreshCw } from 'lucide-react';
import { GatewayHealth } from '../types';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  health: GatewayHealth | null;
  loading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  health,
  loading,
  onRefresh,
}) => {
  const isOnline = health?.status === 'ok';

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">
          <Layers size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="brand-title">llm-gateway</span>
            <span className="brand-badge">REST + MCP</span>
          </div>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          className={`nav-tab ${currentTab === 'models' ? 'active' : ''}`}
          onClick={() => onTabChange('models')}
        >
          <Layers size={15} />
          Models
        </button>
        <button
          className={`nav-tab ${currentTab === 'logs' ? 'active' : ''}`}
          onClick={() => onTabChange('logs')}
        >
          <Activity size={15} />
          Logs
        </button>
        <button
          className={`nav-tab ${currentTab === 'reviews' ? 'active' : ''}`}
          onClick={() => onTabChange('reviews')}
        >
          <Code2 size={15} />
          Reviews
        </button>
        <button
          className={`nav-tab ${currentTab === 'playground' ? 'active' : ''}`}
          onClick={() => onTabChange('playground')}
        >
          <Terminal size={15} />
          Playground
        </button>
        <button
          className={`nav-tab ${currentTab === 'config' ? 'active' : ''}`}
          onClick={() => onTabChange('config')}
        >
          <Settings size={15} />
          Config
        </button>
      </nav>

      <div className="header-status">
        <div className="status-pill">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          <span>{isOnline ? `Port :${health?.server?.port || 20128}` : 'Offline'}</span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Data"
          aria-label="Refresh Data"
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
