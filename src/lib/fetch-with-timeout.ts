// Use AbortController rather than AbortSignal.timeout for native compatibility.
export async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    // Read the body within the timeout too; fetch resolves as soon as headers arrive.
    const body = await response.text();
    return new Response(body, { status: response.status, headers: response.headers });
  } finally {
    clearTimeout(timeout);
  }
}
