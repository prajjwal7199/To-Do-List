// Lightweight AI helpers: supports text-generation providers via simple fetch.
// Configure provider via VITE_AI_PROVIDER ('hf' or 'openai') and corresponding keys
// VITE_HF_API_KEY or VITE_OPENAI_API_KEY in .env

export type SummarizeRange = 'today' | 'yesterday' | 'week' | 'month';

const HF_URL = 'https://api-inference.huggingface.co/models/gpt2';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

async function callHF(prompt: string, apiKey: string) {
  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 180 } }),
  });
  const txt = await res.text();
  try {
    const parsed = JSON.parse(txt);
    if (Array.isArray(parsed) && parsed[0]?.generated_text) return parsed[0].generated_text;
  } catch (e) {}
  return txt;
}

async function callOpenAI(prompt: string, apiKey: string) {
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
  };
  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

export async function summarizeTasks(tasksText: string, range: SummarizeRange) {
  const provider = import.meta.env.VITE_AI_PROVIDER || 'hf';
  const prompt = `Summarize the following tasks for ${range}. Give a concise human-friendly summary (3-6 bullet points):\n\n${tasksText}`;
  try {
    if (provider === 'openai') {
      const key = import.meta.env.VITE_OPENAI_API_KEY;
      if (!key) throw new Error('Missing OPENAI key');
      return await callOpenAI(prompt, key);
    }
    const key = import.meta.env.VITE_HF_API_KEY;
    if (!key) throw new Error('Missing HF key');
    return await callHF(prompt, key);
  } catch (e) {
    return `Unable to generate summary: ${(e as any).message || e}`;
  }
}

// Ask AI for a small icon keyword for a task (single token like 'code', 'coffee', 'shopping')
export async function suggestIconKeyword(taskText: string) {
  const provider = import.meta.env.VITE_AI_PROVIDER || 'hf';
  const prompt = `Provide a single short keyword (one word) best representing an icon for this task. If none, reply 'default'. Task: ${taskText}`;
  try {
    if (provider === 'openai') {
      const key = import.meta.env.VITE_OPENAI_API_KEY;
      if (!key) throw new Error('Missing OPENAI key');
      const out = await callOpenAI(prompt, key);
      return (out || 'default').trim().split(/\s+/)[0].toLowerCase();
    }
    const key = import.meta.env.VITE_HF_API_KEY;
    if (!key) throw new Error('Missing HF key');
    const out = await callHF(prompt, key);
    return (out || 'default').trim().split(/\s+/)[0].toLowerCase();
  } catch (e) {
    return 'default';
  }
}
