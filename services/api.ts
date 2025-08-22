import { FUNCTION_URL } from '@/constants/api';
import { auth } from '@/services/firebase';

export async function callGeminiBackend(payload: any): Promise<any> {
  const { router } = await import('expo-router');

  const user = auth.currentUser;
  if (!user) {
    router.push('/signin');
    throw new Error('AUTH_REQUIRED');
  }

  const idToken = await user.getIdToken(true);

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

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


