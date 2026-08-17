import OpenAI from 'openai';
import { Provider } from './types.js';
import { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ProviderConfig } from '../types.js';

export class OpenAIProvider implements Provider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  private client: OpenAI | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = config;
    const apiKey = config.api_key || process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new OpenAI({
        apiKey,
        baseURL: config.base_url || 'https://api.openai.com/v1',
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured with an API key.');
    }

    const { model, messages, temperature, max_tokens } = request;
    const response = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature,
      max_tokens,
      stream: false,
    });

    return {
      id: response.id,
      object: 'chat.completion',
      created: response.created,
      model: response.model,
      choices: response.choices.map((c) => ({
        index: c.index,
        message: {
          role: 'assistant',
          content: c.message.content || '',
        },
        finish_reason: c.finish_reason as any,
      })),
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async streamComplete(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured with an API key.');
    }

    const { model, messages, temperature, max_tokens } = request;
    const stream = await this.client.chat.completions.create({
      model,
      messages: messages as any,
      temperature,
      max_tokens,
      stream: true,
    });

    let fullContent = '';
    let lastId = `chatcmpl-${Date.now()}`;
    let created = Math.floor(Date.now() / 1000);
    let finishReason: any = null;

    for await (const part of stream) {
      lastId = part.id;
      created = part.created;
      const delta = part.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
      }
      if (part.choices[0]?.finish_reason) {
        finishReason = part.choices[0].finish_reason;
      }

      onChunk({
        id: part.id,
        object: 'chat.completion.chunk',
        created: part.created,
        model: part.model,
        choices: [
          {
            index: 0,
            delta: {
              role: 'assistant',
              content: delta?.content || '',
            },
            finish_reason: part.choices[0]?.finish_reason as any,
          },
        ],
      });
    }

    return {
      id: lastId,
      object: 'chat.completion',
      created,
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: fullContent,
          },
          finish_reason: finishReason || 'stop',
        },
      ],
    };
  }

  async checkHealth(): Promise<{ status: 'healthy' | 'unconfigured' | 'error'; message?: string; latencyMs?: number }> {
    if (!this.client) {
      return { status: 'unconfigured', message: 'API key not provided' };
    }
    const start = Date.now();
    try {
      await this.client.models.list();
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (err: any) {
      return { status: 'error', message: err.message, latencyMs: Date.now() - start };
    }
  }
}
