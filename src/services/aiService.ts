const API_URL = import.meta.env.VITE_AI_API_URL ?? '';

type AiMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function apiFetch<T>(path: string, init: RequestInit & { token?: string } = {}) {
  const { token, headers, ...rest } = init;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'AI request failed');
  }

  return (await response.json()) as T;
}

export async function summarizeNote(file: File, token?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const data = await apiFetch<{ summary?: string }>('/api/ai/summarize', {
    method: 'POST',
    body: formData,
    token,
  });

  if (data.summary) return data.summary;
  throw new Error('No summary returned');
}

export async function chatWithTutor(messages: AiMessage[], token?: string) {
  return apiFetch<{ message: string }>('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    token,
  });
}

export async function generateFlashcards(
  text: string,
  options: { count?: number; difficulty?: 'easy' | 'medium' | 'hard' | 'mixed' } = {},
  token?: string
) {
  return apiFetch<{ cards: { front: string; back: string }[]; raw?: string }>('/api/ai/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, ...options }),
    token,
  });
}

export async function generateStudyPlan(
  input: { goal: string; timeframeWeeks?: number; hoursPerWeek?: number; subjects?: string[] },
  token?: string
) {
  return apiFetch<{ plan: unknown; raw?: string }>('/api/ai/study-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    token,
  });
}
