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

      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(init?.headers || {})
      };

      console.log(`[API Interceptor] Forwarding ${init?.method || 'GET'} to ${targetUrl}`);

      try {
        const response = await originalFetch(targetUrl, {
          ...init,
          headers
        });
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
