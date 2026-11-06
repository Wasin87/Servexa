import { ServiceCategory } from '../types';
import { DiagnosisResult, diagnoseProblemWithRules } from './problemDiagnosis';

/**
 * Diagnoses a user's service issue by calling the server-side Gemini API proxy route (/api/gemini/diagnose).
 * Automatically falls back to rule-based diagnosis if the server is unreachable or reports an error.
 */
export async function diagnoseWithAI(
  userInput: string,
  categories: ServiceCategory[]
): Promise<DiagnosisResult> {
  const fallback = diagnoseProblemWithRules(userInput, categories);

  if (!userInput.trim()) {
    return fallback;
  }

  try {
    const res = await fetch('/api/gemini/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, categories }),
    });

    if (!res.ok) {
      console.warn('Server Gemini diagnosis returned status:', res.status);
      return fallback;
    }

    const data = await res.json();
    if (!data || !data.result) {
      return fallback;
    }

    const parsed = data.result;
    const matchedCategory = categories.find((c) => c.id === parsed.categoryId) || categories[0];

    return {
      categoryId: matchedCategory.id,
      categoryNameEn: matchedCategory.nameEn,
      categoryNameBn: matchedCategory.nameBn,
      confidence: parsed.confidence || fallback.confidence,
      recommendedUrgency: parsed.recommendedUrgency || fallback.recommendedUrgency,
      estimatedCostRange: fallback.estimatedCostRange,
      keySymptoms: parsed.keySymptoms?.length ? parsed.keySymptoms : fallback.keySymptoms,
      reasoningEn: parsed.reasoningEn || fallback.reasoningEn,
      reasoningBn: parsed.reasoningBn || fallback.reasoningBn,
    };
  } catch (error) {
    console.warn('Network issue calling server Gemini diagnosis, using fallback:', error);
    return fallback;
  }
}

/**
 * General text generation calling server-side Gemini API (/api/gemini/generate).
 */
export async function generateContentWithAI(
  prompt: string,
  options?: { model?: string }
): Promise<string> {
  const res = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: options?.model }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Generate failed with status: ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
}

/**
 * Streaming content generation calling server-side SSE endpoint (/api/gemini/stream).
 */
export async function generateContentStreamWithAI(
  prompt: string,
  onChunk: (text: string) => void,
  options?: { model?: string }
): Promise<string> {
  const res = await fetch('/api/gemini/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: options?.model }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Streaming failed with status: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) {
          fullText += parsed.text;
          onChunk(parsed.text);
        }
      } catch {
        // ignore partial parse errors
      }
    }
  }

  return fullText;
}

/**
 * Connects to the server's WebSocket Live API bridge (/live) for real-time voice and audio.
 */
export function createLiveAudioSession(options: {
  onAudio?: (base64Pcm: string) => void;
  onText?: (text: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/live`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.audio && options.onAudio) options.onAudio(data.audio);
      if (data.text && options.onText) options.onText(data.text);
      if (data.error && options.onError) options.onError(data.error);
    } catch (err) {
      console.error('Error parsing live socket message:', err);
    }
  };

  ws.onerror = () => {
    if (options.onError) options.onError('WebSocket connection error');
  };

  ws.onclose = () => {
    if (options.onClose) options.onClose();
  };

  return {
    sendAudio: (base64Pcm16k: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ audio: base64Pcm16k }));
      }
    },
    sendText: (text: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ text }));
      }
    },
    close: () => {
      ws.close();
    },
    get readyState() {
      return ws.readyState;
    },
  };
}
