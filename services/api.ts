import { FUNCTION_URL } from '@/constants/api';
import { auth } from '@/services/firebase';

const FETCH_TIMEOUT = 30000; // 30 seconds

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timeout - please check your internet connection');
    }
    throw error;
  }
}

export async function callGeminiBackend(payload: any): Promise<any> {
  let router;
  try {
    const routerModule = await import('expo-router');
    router = routerModule.router;
  } catch (error) {
    if (__DEV__) {
      console.error('[API] Failed to import router:', error);
    }
    throw new Error('Navigation error - please restart the app');
  }

  const user = auth.currentUser;
  if (!user) {
    router.push('/signin');
    throw new Error('AUTH_REQUIRED');
  }

  const idToken = await user.getIdToken(true);

  const res = await fetchWithTimeout(
    FUNCTION_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
    },
    FETCH_TIMEOUT
  );

  if (res.status === 402) {
    router.push('/paywall');
    const err: any = new Error('LIMIT');
    err.code = 'LIMIT';
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${text}`);
  }

  return res.json();
}


