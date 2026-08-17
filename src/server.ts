import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { router } from './router.js';
import { logStore } from './store/logs.js';
import { ChatCompletionRequest } from './types.js';
import { buildReviewPrompt, parseReviewFeedback } from './utils/review.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health endpoint
app.get('/v1/health', async (req: Request, res: Response) => {
  try {
    const providerHealth = await router.checkHealth();
    const stats = logStore.getStats();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      server: {
        port: config.server.port,
        default_reviewer: router.getDefaultReviewer(),
      },
      providers: providerHealth,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// OpenAI compatible models list
app.get('/v1/models', (req: Request, res: Response) => {
  try {
    const models = router.getModels();
    res.json({
      object: 'list',
      data: models.map((m) => ({
        id: m.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: m.provider,
        name: m.name,
        aliases: m.aliases || [],
        available: m.available,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// OpenAI compatible chat completion endpoint (non-streaming)
app.post('/v1/chat/completions', async (req: Request, res: Response) => {
  const body = req.body as ChatCompletionRequest;

  if (!body.model || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({
      error: {
        message: "Invalid request payload. 'model' and 'messages' array are required.",
        type: 'invalid_request_error',
      },
    });
  }

  try {
    const completion = await router.route(body);
    res.json(completion);
  } catch (err: any) {
    res.status(500).json({
      error: {
        message: err.message,
        type: 'gateway_error',
      },
    });
  }
});

// Logs endpoint
app.get('/v1/logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const model = req.query.model as string | undefined;
  const status = req.query.status as 'success' | 'error' | undefined;

  const logs = logStore.getLogs(limit, { model, status });
  const reviews = logStore.getReviews(50);
  const stats = logStore.getStats();

  res.json({
    logs,
    reviews,
    stats,
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : (config.server?.port || 20128);
const HOST = config.server?.host || '0.0.0.0';

export const server = app.listen(PORT, HOST, () => {
  console.log(`[LLM Gateway] Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`[LLM Gateway] Default reviewer: ${router.getDefaultReviewer()}`);
});

export default app;
