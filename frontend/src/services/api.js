export async function api(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`/api${path}`, { method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 409 && data.detail?.result) return data.detail.result;
      const message = Array.isArray(data.detail) ? data.detail.map(item => `${item.field}: ${item.message}`).join(' ') : data.detail;
      throw new Error(typeof message === 'string' ? message : 'The request could not be completed. Please retry.');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError' || error instanceof TypeError) throw new Error('Cannot reach the game server. Keep this page open and retry when it reconnects.');
    throw error;
  } finally { clearTimeout(timeout); }
}
