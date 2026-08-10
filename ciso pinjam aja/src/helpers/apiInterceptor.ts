let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('auth_refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch('http://localhost:4000/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json = await res.json();

    if (json.success && json.data?.token) {
      localStorage.setItem('auth_token', json.data.token);
      localStorage.setItem('token', json.data.token);
      if (json.data.refreshToken) {
        localStorage.setItem('auth_refresh_token', json.data.refreshToken);
      }
      console.log('[API Interceptor] Token refreshed successfully');
      return true;
    }
  } catch (err) {
    console.error('[API Interceptor] Token refresh failed', err);
  }
  return false;
}

export function initApiInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (input, init) => {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    // Bypass real backend requests if they are already absolute to backend
    if (urlString.startsWith('http://localhost:4000')) {
      return originalFetch(input, init);
    }
    
    // Check if it's an API route starting with /api/
    if (urlString.startsWith('/api/')) {
      const token = localStorage.getItem('auth_token');
      const targetUrl = `http://localhost:4000${urlString}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(init?.headers as Record<string, string> || {})
      };

      const isRetry = (init as any)?._isRetry;

      console.log(`[API Interceptor] Forwarding ${init?.method || 'GET'} to ${targetUrl}`);

      try {
        const response = await originalFetch(targetUrl, {
          ...init,
          headers
        });

        // Auto-refresh on 401 (only once, skip for auth endpoints)
        if (response.status === 401 && !isRetry && !urlString.includes('/auth/refresh') && !urlString.includes('/auth/login')) {
          console.log('[API Interceptor] Got 401, attempting token refresh...');

          // Deduplicate concurrent refresh attempts
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = tryRefreshToken().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }

          const refreshed = await (refreshPromise || tryRefreshToken());

          if (refreshed) {
            // Retry with new token
            const newToken = localStorage.getItem('auth_token');
            const retryHeaders: Record<string, string> = {
              ...headers,
              ...(newToken ? { 'Authorization': `Bearer ${newToken}` } : {}),
            };
            return originalFetch(targetUrl, {
              ...init,
              headers: retryHeaders,
              _isRetry: true,
            } as any);
          }
        }

        return response;
      } catch (err: any) {
        console.error('[API Interceptor] Forwarding failed', err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return originalFetch(input, init);
  };
}
