import Anthropic from '@anthropic-ai/sdk';
import { Provider } from './types.js';
import { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk, ProviderConfig } from '../types.js';

export class AnthropicProvider implements Provider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic';
  private client: Anthropic | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = config;
    const apiKey = config.api_key || process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey.trim().length > 0) {
      this.client = new Anthropic({
        apiKey,
        baseURL: config.base_url || 'https://api.anthropic.com',
      });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  private transformMessages(messages: { role: string; content: string }[]): {
    system?: string;
    anthropicMessages: Anthropic.MessageParam[];
  } {
    const systemParts: string[] = [];
    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemParts.push(msg.content);
      } else if (msg.role === 'user' || msg.role === 'assistant') {
        anthropicMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Anthropic requires alternating user/assistant and first message must be user
    if (anthropicMessages.length === 0 || anthropicMessages[0].role !== 'user') {
      anthropicMessages.unshift({
        role: 'user',
        content: 'Hello',
      });
    }

    return {
      system: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
      anthropicMessages,
    };
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured with an API key.');
    }

    const { model, messages, max_tokens, temperature } = request;
    const { system, anthropicMessages } = this.transformMessages(messages);

    const response = await this.client.messages.create({
      model,
      messages: anthropicMessages,
      system,
      max_tokens: max_tokens || 4096,
      temperature: temperature !== undefined ? temperature : 1.0,
    });

    let fullText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        fullText += block.text;
      }
    }

    return {
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: fullText,
          },
          finish_reason: response.stop_reason === 'max_tokens' ? 'length' : 'stop',
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async streamComplete(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured with an API key.');
    }

    const { model, messages, max_tokens, temperature } = request;
    const { system, anthropicMessages } = this.transformMessages(messages);

    const stream = await this.client.messages.create({
      model,
      messages: anthropicMessages,
      system,
      max_tokens: max_tokens || 4096,
      temperature: temperature !== undefined ? temperature : 1.0,
      stream: true,
    });

    let fullText = '';
    const id = `msg-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);
    let finishReason: 'stop' | 'length' | null = 'stop';
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullText += text;
        onChunk({
          id,
          object: 'chat.completion.chunk',
          created,
          model,
          choices: [
            {
              index: 0,
              delta: {
                role: 'assistant',
                content: text,
              },
              finish_reason: null,
            },
          ],
        });
      } else if (event.type === 'message_delta') {
        if (event.delta.stop_reason === 'max_tokens') finishReason = 'length';
        if (event.usage) outputTokens = event.usage.output_tokens;
      } else if (event.type === 'message_start' && event.message.usage) {
        inputTokens = event.message.usage.input_tokens;
      }
    }

    // Final chunk
    onChunk({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: finishReason,
        },
      ],
    });

    return {
      id,
      object: 'chat.completion',
      created,
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: fullText,
          },
          finish_reason: finishReason,
        },
      ],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
    };
  }

  async checkHealth(): Promise<{ status: 'healthy' | 'unconfigured' | 'error'; message?: string; latencyMs?: number }> {
    if (!this.client) {
      return { status: 'unconfigured', message: 'API key not provided' };
    }
    const start = Date.now();
    try {
      // Test basic connectivity or lightweight request
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (err: any) {
      return { status: 'error', message: err.message, latencyMs: Date.now() - start };
    }
  }
}
