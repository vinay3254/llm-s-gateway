export interface ModelData {
  id: string;
  name: string;
  owned_by: string;
  aliases: string[];
  available: boolean;
}

export interface RequestLogItem {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  promptSummary: string;
  messages: Array<{ role: string; content: string }>;
  responseContent?: string;
  status: 'success' | 'error';
  latencyMs: number;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  errorMessage?: string;
  isReview?: boolean;
}

export interface ReviewRecordItem {
  id: string;
  timestamp: string;
  model: string;
  focus?: string;
  context?: string;
  diffSnippet?: string;
  codeSnippet?: string;
  feedback: {
    summary: string;
    score?: number;
    criticalIssues: string[];
    improvements: string[];
    positiveNotes: string[];
    rawMarkdown: string;
  };
  latencyMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface GatewayHealth {
  status: string;
  timestamp: string;
  server: {
    port: number;
    default_reviewer: string;
  };
  providers: Record<string, {
    status: 'healthy' | 'unconfigured' | 'error';
    message?: string;
    latencyMs?: number;
  }>;
  stats: {
    totalRequests: number;
    successfulRequests: number;
    errorRequests: number;
    avgLatencyMs: number;
    totalTokens: number;
    totalReviews: number;
  };
}

export interface GatewayConfigData {
  server: {
    port: number;
    host: string;
  };
  default_reviewer: string;
  providers: {
    openai: {
      enabled: boolean;
      hasApiKey: boolean;
      models: Array<{ id: string; name: string }>;
    };
    anthropic: {
      enabled: boolean;
      hasApiKey: boolean;
      models: Array<{ id: string; name: string }>;
    };
    mock: {
      enabled: boolean;
      models: Array<{ id: string; name: string }>;
    };
  };
}
