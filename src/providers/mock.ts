import { Provider } from './types.js';
import { ChatCompletionRequest, ChatCompletionResponse, ChatCompletionChunk } from '../types.js';

export class MockProvider implements Provider {
  readonly id = 'mock';
  readonly name = 'Mock Provider (Local Simulation)';

  isAvailable(): boolean {
    return true;
  }

  private generateMockResponse(request: ChatCompletionRequest): string {
    const lastMessage = request.messages[request.messages.length - 1]?.content || '';

    if (lastMessage.includes('review') || lastMessage.includes('Code to review') || lastMessage.includes('Diff to review')) {
      return `### Code Review Summary
The provided code was analyzed for architecture, safety, and performance.

#### Strengths
- Clear modular structure and naming conventions.
- Explicit TypeScript typings and interfaces.

#### Critical Issues & Recommendations
1. **Error Handling**: Ensure graceful error boundaries around async network calls.
2. **Environment Validation**: Validate required runtime configuration keys on startup.

**Overall Rating**: 9/10 - Production Ready.`;
    }

    return `This is a response from the LLM Gateway (${request.model}).
Your message was: "${lastMessage.substring(0, 120)}${lastMessage.length > 120 ? '...' : ''}".
The gateway successfully received and routed your request.`;
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const content = this.generateMockResponse(request);
    return {
      id: `mock-cmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 35,
        completion_tokens: 65,
        total_tokens: 100,
      },
    };
  }

  async streamComplete(
    request: ChatCompletionRequest,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<ChatCompletionResponse> {
    const content = this.generateMockResponse(request);
    const words = content.split(' ');
    const id = `mock-cmpl-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);

    for (const word of words) {
      onChunk({
        id,
        object: 'chat.completion.chunk',
        created,
        model: request.model,
        choices: [
          {
            index: 0,
            delta: {
              role: 'assistant',
              content: word + ' ',
            },
            finish_reason: null,
          },
        ],
      });
      // Small tick
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    onChunk({
      id,
      object: 'chat.completion.chunk',
      created,
      model: request.model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop',
        },
      ],
    });

    return {
      id,
      object: 'chat.completion',
      created,
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 35,
        completion_tokens: 65,
        total_tokens: 100,
      },
    };
  }

  async checkHealth(): Promise<{ status: 'healthy'; latencyMs: number }> {
    return { status: 'healthy', latencyMs: 1 };
  }
}
