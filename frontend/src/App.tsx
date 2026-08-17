import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ModelsView } from './components/ModelsView';
import { LogsView } from './components/LogsView';
import { ReviewsView } from './components/ReviewsView';
import { PlaygroundView } from './components/PlaygroundView';
import { ConfigView } from './components/ConfigView';
import { fetchHealth, fetchModels, fetchLogs, fetchConfig } from './api';
import { GatewayHealth, GatewayConfigData, ModelData, RequestLogItem, ReviewRecordItem } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('models');
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [models, setModels] = useState<ModelData[]>([]);
  const [logs, setLogs] = useState<RequestLogItem[]>([]);
  const [reviews, setReviews] = useState<ReviewRecordItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState<GatewayConfigData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPlaygroundModel, setSelectedPlaygroundModel] = useState<string | undefined>(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, m, l, c] = await Promise.allSettled([
        fetchHealth(),
        fetchModels(),
        fetchLogs(100),
        fetchConfig(),
      ]);

      if (h.status === 'fulfilled') setHealth(h.value);
      if (m.status === 'fulfilled') setModels(m.value);
      if (l.status === 'fulfilled') {
        setLogs(l.value.logs || []);
        setReviews(l.value.reviews || []);
        setStats(l.value.stats || null);
      }
      if (c.status === 'fulfilled') setConfig(c.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 5000); // 5-second polling for live stats
    return () => clearInterval(timer);
  }, [loadData]);

  const handleSelectForPlayground = (modelId: string) => {
    setSelectedPlaygroundModel(modelId);
    setCurrentTab('playground');
  };

  return (
    <div className="app-container">
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        health={health}
        loading={loading}
        onRefresh={loadData}
      />

      <main className="main-content">
        {currentTab === 'models' && (
          <ModelsView
            models={models}
            health={health}
            onSelectForPlayground={handleSelectForPlayground}
          />
        )}

        {currentTab === 'logs' && <LogsView logs={logs} stats={stats} />}

        {currentTab === 'reviews' && (
          <ReviewsView
            reviews={reviews}
            models={models}
            onReviewCreated={loadData}
          />
        )}

        {currentTab === 'playground' && (
          <PlaygroundView
            models={models}
            initialModel={selectedPlaygroundModel}
            onCompletionDone={loadData}
          />
        )}

        {currentTab === 'config' && <ConfigView config={config} health={health} />}
      </main>
    </div>
  );
};

export default App;
