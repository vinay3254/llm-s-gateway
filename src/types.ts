export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: any;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
    };
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  aliases?: string[];
  available: boolean;
}

export interface ProviderConfig {
  api_key?: string;
  base_url?: string;
  models?: Array<{
    id: string;
    name: string;
    aliases?: string[];
  }>;
  enabled?: boolean;
}

export interface GatewayConfig {
  server: {
    port: number;
    host: string;
  };
  default_reviewer: string;
  providers: {
    openai?: ProviderConfig;
    anthropic?: ProviderConfig;
    mock?: ProviderConfig;
    [key: string]: ProviderConfig | undefined;
  };
}

export interface RequestLog {
  id: string;
  timestamp: string;
  model: string;
  provider: string;
  promptSummary: string;
  messages: Message[];
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

export interface ReviewRequest {
  code: string;
  language?: string;
  instructions?: string;
  reviewer_model?: string;
}

export interface ReviewRecord {
  id: string;
  timestamp: string;
  model: string;
  code: string;
  language?: string;
  instructions?: string;
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
