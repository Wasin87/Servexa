import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '10mb' }));

// Shared server-side Gemini AI client initialization with User-Agent header for telemetry
const getAIClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Problem diagnosis endpoint (calls Gemini 3.8 Flash)
app.post('/api/gemini/diagnose', async (req, res) => {
  const { userInput, categories } = req.body;
  if (!userInput || typeof userInput !== 'string') {
    return res.status(400).json({ error: 'userInput is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server.',
      fallbackNeeded: true,
    });
  }

  try {
    const categoryListStr = Array.isArray(categories)
      ? categories.map((c: any) => `${c.id}: ${c.nameEn || ''} / ${c.nameBn || ''}`).join('\n')
      : '';

    const prompt = `You are Servexa's smart problem diagnostic engine for Bangladesh home services.
A user described their problem: "${userInput}"

Available categories:
${categoryListStr}

Analyze the problem and respond ONLY in valid JSON matching this structure:
{
  "categoryId": "one of the available category IDs",
  "confidence": number between 70 and 99,
  "recommendedUrgency": "normal" | "today" | "emergency",
  "keySymptoms": ["symptom1", "symptom2"],
  "reasoningEn": "Short explanation in English (max 20 words)",
  "reasoningBn": "সংক্ষিপ্ত কারণ বাংলায় (সর্বোচ্চ ২০ শব্দ)"
}`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 8000)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      timeoutPromise,
    ]);

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ result: parsed });
  } catch (err: any) {
    console.warn('Gemini server diagnosis warning:', err?.message || err);
    return res.status(500).json({
      error: err?.message || 'Gemini diagnosis failed',
      fallbackNeeded: true,
    });
  }
});

// Text generation endpoint
app.post('/api/gemini/generate', async (req, res) => {
  const { prompt, model, config } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), 8000)
    );

    const response: any = await Promise.race([
      ai.models.generateContent({
        model: model || 'gemini-3.8-flash',
        contents: prompt,
        config: config || {},
      }),
      timeoutPromise,
    ]);
    return res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Gemini generate error:', err);
    return res.status(500).json({ error: err?.message || 'Gemini generate failed' });
  }
});

// Streaming text generation endpoint via Server-Sent Events (SSE)
app.post('/api/gemini/stream', async (req, res) => {
  const { prompt, model, config } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const ai = getAIClient();
  if (!ai) {
    return res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await ai.models.generateContentStream({
      model: model || 'gemini-3.8-flash',
      contents: prompt,
      config: config || {},
    });

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Gemini stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err?.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
});

// WebSocket Server for Live API voice/audio streaming bridge
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (pathname === '/live' || pathname === '/api/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (err) {
    console.error('Upgrade error:', err);
    socket.destroy();
  }
});

wss.on('connection', async (clientWs: WebSocket) => {
  const ai = getAIClient();
  if (!ai) {
    clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }));
    clientWs.close();
    return;
  }

  try {
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are Servexa AI, an intelligent assistant for Bangladesh on-demand home services. Help users diagnose plumbing, electrical, AC, and appliance issues and suggest verified technicians.',
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
            }
            if (part.text) {
              clientWs.send(JSON.stringify({ text: part.text }));
            }
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
        onerror: (err) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          }
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: parsed.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    clientWs.on('close', () => {
      try {
        session.close();
      } catch {
        // ignore
      }
    });
  } catch (err: any) {
    console.error('Live API connection error:', err);
    clientWs.send(JSON.stringify({ error: err?.message || 'Failed to connect to Gemini Live API' }));
    clientWs.close();
  }
});

// Vite Middleware for Development / Static Hosting for Production
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT} (isProduction: ${isProduction})`);
});
