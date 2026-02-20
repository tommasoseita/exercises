import { Exercise, ChatMessage, ChatResponse } from './types';

const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listExercises: () => request<Exercise[]>('/exercises'),

  getExercise: (id: string) => request<Exercise>(`/exercises/${id}`),

  createExercise: (data: Partial<Exercise>) =>
    request<Exercise>('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExercise: (id: string, data: Partial<Exercise>) =>
    request<Exercise>(`/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExercise: (id: string) =>
    request<void>(`/exercises/${id}`, { method: 'DELETE' }),

  chat: (exerciseId: string, messages: ChatMessage[]) =>
    request<ChatResponse>(`/chat/${exerciseId}`, {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),

  getScormUrl: (id: string) => `${BASE}/scorm/${id}`,
};
