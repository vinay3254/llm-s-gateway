import { config } from './config.js';
import { Provider } from './providers/types.js';
import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { MockProvider } from './providers/mock.js';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ModelInfo,
  RequestLog,
} from './types.js';
import { logStore } from './store/logs.js';

export class Router {
  private providers: Map<string, Provider> = new Map();
  private modelToProviderMap: Map<string, { providerId: string; targetModelId: string }> = new Map();
  private modelInfos: ModelInfo[] = [];

  constructor() {
    this.initProviders();
  }

  public initProviders() {
    this.providers.clear();
    this.modelToProviderMap.clear();
    this.modelInfos = [];

    // OpenAI
    const openaiConfig = config.providers?.openai;
    const openai = new OpenAIProvider(openaiConfig);
    this.providers.set('openai', openai);

    if (openaiConfig?.models) {
      for (const m of openaiConfig.models) {
        this.registerModel(m.id, m.name, 'openai', m.aliases, openai.isAvailable());
      }
    }

    // Anthropic
    const anthropicConfig = config.providers?.anthropic;
    const anthropic = new AnthropicProvider(anthropicConfig);
    this.providers.set('anthropic', anthropic);

    if (anthropicConfig?.models) {
      for (const m of anthropicConfig.models) {
        this.registerModel(m.id, m.name, 'anthropic', m.aliases, anthropic.isAvailable());
      }
    }

    // Mock
    const mock = new MockProvider();
    this.providers.set('mock', mock);
    if (config.providers?.mock?.enabled) {
      if (config.providers.mock.models) {
        for (const m of config.providers.mock.models) {
          this.registerModel(m.id, m.name, 'mock', m.aliases, true);
        }
      }
    }
  }

  private registerModel(
    id: string,
    name: string,
    providerId: string,
    aliases?: string[],
    available: boolean = true
  ) {
    this.modelToProviderMap.set(id.toLowerCase(), { providerId, targetModelId: id });
    if (aliases) {
      for (const alias of aliases) {
        this.modelToProviderMap.set(alias.toLowerCase(), { providerId, targetModelId: id });
      }
    }
    this.modelInfos.push({
      id,
      name,
      provider: providerId,
      aliases,
      available,
    });
  }

  public resolveModel(requestedModel: string): { provider: Provider; modelId: string } {
    const key = requestedModel.toLowerCase();
    const mapping = this.modelToProviderMap.get(key);

    if (mapping) {
      const provider = this.providers.get(mapping.providerId);
      if (provider) {
        // If provider is not available (e.g. no key), fall back to mock if enabled
        if (!provider.isAvailable() && this.providers.get('mock')) {
          return { provider: this.providers.get('mock')!, modelId: mapping.targetModelId };
        }
        return { provider, modelId: mapping.targetModelId };
      }
    }

    // Auto-detect based on prefix
    if (key.startsWith('gpt-') || key.startsWith('o1') || key.startsWith('o3') || key.startsWith('text-embedding')) {
      const openai = this.providers.get('openai');
      if (openai?.isAvailable()) {
        return { provider: openai, modelId: requestedModel };
      }
    } else if (key.startsWith('claude-')) {
      const anthropic = this.providers.get('anthropic');
      if (anthropic?.isAvailable()) {
        return { provider: anthropic, modelId: requestedModel };
      }
    }

    // Fallback to mock provider or default
    const mock = this.providers.get('mock');
    if (mock) {
      return { provider: mock, modelId: requestedModel };
    }

    throw new Error(`Model '${requestedModel}' not found and no available provider could route this request.`);
  }

  public getModels(): ModelInfo[] {
    return this.modelInfos;
  }

  public getDefaultReviewer(): string {
    return config.default_reviewer || 'claude-sonnet-4-6';
  }

  public async checkHealth(): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    for (const [id, provider] of this.providers.entries()) {
      result[id] = await provider.checkHealth();
    }
    return result;
  }

  public async route(request: ChatCompletionRequest, isReview = false): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    const promptSummary = request.messages[request.messages.length - 1]?.content.substring(0, 100) || '';
    let resolved: { provider: Provider; modelId: string } | null = null;

    try {
      resolved = this.resolveModel(request.model);
      const targetReq = { ...request, model: resolved.modelId };
      const response = await resolved.provider.complete(targetReq);
      const latencyMs = Date.now() - startTime;

      const log: RequestLog = {
        id: response.id,
        timestamp: new Date().toISOString(),
        model: request.model,
        provider: resolved.provider.id,
        promptSummary,
        messages: request.messages,
        responseContent: response.choices[0]?.message.content,
        status: 'success',
        latencyMs,
        tokens: response.usage
          ? {
              prompt: response.usage.prompt_tokens,
              completion: response.usage.completion_tokens,
              total: response.usage.total_tokens,
            }
          : undefined,
        isReview,
      };
      logStore.addLog(log);

      return response;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const log: RequestLog = {
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: request.model,
        provider: resolved?.provider.id || 'unknown',
        promptSummary,
        messages: request.messages,
        status: 'error',
        latencyMs,
        errorMessage: err.message,
        isReview,
      };
      logStore.addLog(log);
      throw err;
    }
  }

  public async routeStream(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionChunk) => void,
    isReview = false
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    const promptSummary = request.messages[request.messages.length - 1]?.content.substring(0, 100) || '';
    let resolved: { provider: Provider; modelId: string } | null = null;

    try {
      resolved = this.resolveModel(request.model);
      const targetReq = { ...request, model: resolved.modelId };
      const response = await resolved.provider.streamComplete(targetReq, onChunk);
      const latencyMs = Date.now() - startTime;

      const log: RequestLog = {
        id: response.id,
        timestamp: new Date().toISOString(),
        model: request.model,
        provider: resolved.provider.id,
        promptSummary,
        messages: request.messages,
        responseContent: response.choices[0]?.message.content,
        status: 'success',
        latencyMs,
        tokens: response.usage
          ? {
              prompt: response.usage.prompt_tokens,
              completion: response.usage.completion_tokens,
              total: response.usage.total_tokens,
            }
          : undefined,
        isReview,
      };
      logStore.addLog(log);

      return response;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const log: RequestLog = {
        id: `err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: request.model,
        provider: resolved?.provider.id || 'unknown',
        promptSummary,
        messages: request.messages,
        status: 'error',
        latencyMs,
        errorMessage: err.message,
        isReview,
      };
      logStore.addLog(log);
      throw err;
    }
  }
}

export const router = new Router();
