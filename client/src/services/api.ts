const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`