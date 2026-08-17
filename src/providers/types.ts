import { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../types.js';

export interface Provider {
  readonly id: string;
  readonly name: string;

  isAvailable(): boolean;

  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  streamComplete(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse>;

  checkHealth(): Promise<{
    status: 'healthy' | 'unconfigured' | 'error';
    message?: string;
    latencyMs?: number;
  }>;
}
