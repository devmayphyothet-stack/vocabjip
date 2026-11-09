const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { apiKey, model, payload } = req.body || {};
    if (typeof apiKey !== 'string' || (model != null && (typeof model !== 'string' || !/^(models\/)?[a-zA-Z0-9.-]+$/.test(model))) || !payload || typeof payload !== 'object' || !Array.isArray(payload.contents)) {
      return res.status(400).json({ error: { message: 'Invalid request' } });
    }
    if (JSON.stringify(payload).length > 8000000) return res.status(413).json({ error: { message: 'Request too large' } });
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      return res.status(400).json({ error: { message: 'Missing Gemini API key' } });
    }

    const initialModel = (model || 'gemini-flash-lite-latest').replace(/^models\//, '');
    const modelsToTry = [
      initialModel,
      ...FALLBACK_MODELS.filter((m) => m !== initialModel),
    ];

    let lastStatus = 500;
    let lastData = {};
    let lastModel = initialModel;

    for (const targetModel of modelsToTry.slice(0, 2)) {
      const url = `${GEMINI_API_URL}/${targetModel}:generateContent`;
      const upstream = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleanKey },
        body: JSON.stringify(payload),
      });

      const data = await upstream.json().catch(() => ({}));
      if (upstream.ok) {
        return res.status(200).json({
          ok: true,
          status: 200,
          modelUsed: targetModel,
          data,
        });
      }

      lastStatus = upstream.status;
      lastData = data;
      lastModel = targetModel;

      if (![404, 503].includes(upstream.status)) break;
      const errMsg = (data?.error?.message || '').toLowerCase();
      if (
        upstream.status === 400 &&
        (errMsg.includes('api key not valid') || errMsg.includes('api_key_invalid'))
      ) {
        break;
      }
    }

    return res.status(lastStatus).json({
      ok: false,
      status: lastStatus,
      modelUsed: lastModel,
      data: lastData,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      status: 500,
      error: { message: 'AI request could not finish. Please retry.' },
    });
  }
};

