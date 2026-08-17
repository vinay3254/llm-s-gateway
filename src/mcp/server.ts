import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { router } from '../router.js';
import { buildReviewPrompt, parseReviewFeedback } from '../utils/review.js';
import { logStore } from '../store/logs.js';

// Create an MCP server instance
const server = new Server(
  {
    name: 'llm-gateway-reviewer',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register list of tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'review_code',
        description: 'Review code using the configured LLM gateway reviewer model.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Source code content to review',
            },
            language: {
              type: 'string',
              description: 'Programming language of the code',
            },
            instructions: {
              type: 'string',
              description: 'Specific instructions or review guidance',
            },
            reviewer_model: {
              type: 'string',
              description: 'Specific model to use for review (defaults to config default_reviewer)',
            },
          },
          required: ['code'],
        },
      },
    ],
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'review_code') {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Unknown tool: ${request.params.name}`,
        },
      ],
    };
  }

  const args = (request.params.arguments || {}) as {
    code?: string;
    language?: string;
    instructions?: string;
    reviewer_model?: string;
  };

  const { code, language, instructions, reviewer_model } = args;

  if (!code || !code.trim()) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error: "code" must be provided for a code review.',
        },
      ],
    };
  }

  const reviewerModel = reviewer_model || router.getDefaultReviewer();
  const prompt = buildReviewPrompt({ code, language, instructions });
  const startTime = Date.now();

  try {
    const completion = await router.route(
      {
        model: reviewerModel,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert senior code reviewer. Analyze the code thoroughly, identifying logic bugs, security issues, performance bottlenecks, and best practices. Format your review with clear markdown sections, bullets, and a quality score out of 10.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      true
    );

    const rawMarkdown = completion.choices[0]?.message.content || 'No feedback provided.';
    const parsed = parseReviewFeedback(rawMarkdown);
    const latencyMs = Date.now() - startTime;

    // Log review
    logStore.addReview({
      id: `mcp-rev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      model: reviewerModel,
      code,
      language,
      instructions,
      feedback: {
        ...parsed,
        rawMarkdown,
      },
      latencyMs,
      status: 'success',
    });

    return {
      content: [
        {
          type: 'text',
          text: rawMarkdown,
        },
      ],
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    logStore.addReview({
      id: `mcp-rev-${Date.now()}`,
      timestamp: new Date().toISOString(),
      model: reviewerModel,
      code,
      language,
      instructions,
      feedback: {
        summary: 'Review failed',
        criticalIssues: [err.message],
        improvements: [],
        positiveNotes: [],
        rawMarkdown: `Review execution failed: ${err.message}`,
      },
      latencyMs,
      status: 'error',
      errorMessage: err.message,
    });

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Code review failed: ${err.message}`,
        },
      ],
    };
  }
});

// Start server on stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP Reviewer] Stdio server connected and listening for tool calls.');
}

main().catch((err) => {
  console.error('[MCP Reviewer] Fatal error starting server:', err);
  process.exit(1);
});
