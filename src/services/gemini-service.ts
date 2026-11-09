import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { validateEssayEvaluation } from '@/lib/ai-validation';
import { Platform } from 'react-native';
import { AiEvaluationResult, AiEvaluationResponse } from '@/types/ai';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
let cachedWorkingModel = 'gemini-flash-lite-latest';

export function extractGeminiText(data: any): string | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i]?.text && !parts[i]?.thought) {
      return parts[i].text;
    }
  }
  return null;
}

export async function callGeminiGenerateContent(
  apiKey: string,
  bodyPayload: Record<string, any>,
  preferredModel?: string
): Promise<{ ok: boolean; status: number; data: any; modelUsed: string }> {
  const cleanKey = apiKey.trim();
  const rawPreferred = (preferredModel || '').replace(/^models\//, '');
  // Prefer fast, non-overloaded flash-lite models first
  const initialModel =
    !rawPreferred ||
    rawPreferred === 'gemini-2.5-flash' ||
    rawPreferred === 'gemini-3-flash-preview' ||
    rawPreferred === 'gemini-3.8-flash'
      ? cachedWorkingModel
      : rawPreferred;

  // 1. Try serverless proxy first on Web (or as fallback on native) to avoid regional IP blocks
  const proxyUrl =
    Platform.OS === 'web' ? '/api/gemini' : 'https://vocabjip.vercel.app/api/gemini';
  try {
    const proxyRes = await fetchWithTimeout(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: cleanKey,
        model: initialModel,
        payload: bodyPayload,
      }),
    }, 35000);
    const contentType = proxyRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const proxyJson = await proxyRes.json();
      if (proxyJson && typeof proxyJson.ok === 'boolean') {
        if (proxyJson.ok && proxyJson.modelUsed) {
          cachedWorkingModel = proxyJson.modelUsed;
        }
        return {
          ok: proxyJson.ok,
          status: proxyJson.status || proxyRes.status,
          data: proxyJson.data || proxyJson,
          modelUsed: proxyJson.modelUsed || initialModel,
        };
      }
    }
  } catch (_) {
    // Proxy unavailable (e.g. local dev server) — proceed to direct Google API call
  }

  const tryModel = async (targetModel: string) => {
    const cleanModel = targetModel.replace(/^models\//, '');
    const url = `${GEMINI_API_URL}/${cleanModel}:generateContent`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cleanKey },
      body: JSON.stringify(bodyPayload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data, modelUsed: cleanModel };
  };

  let attempt = await tryModel(initialModel);
  if (attempt.ok) {
    cachedWorkingModel = attempt.modelUsed;
    return attempt;
  }

  // Auto-fallback across all supported Flash models unless the API key itself is invalid
  const errMsg: string = attempt.data?.error?.message || '';
  const isInvalidKey =
    attempt.status === 400 &&
    (errMsg.toLowerCase().includes('api key not valid') ||
      errMsg.toLowerCase().includes('api_key_invalid'));

  if (!isInvalidKey && [404, 503].includes(attempt.status)) {
    const candidates: string[] = [];
    const matchRecommended = errMsg.match(/models\/(gemini-[a-zA-Z0-9.-]+)/);
    if (matchRecommended?.[1]) {
      candidates.push(matchRecommended[1]);
    }

    for (const fb of [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ]) {
      if (!candidates.includes(fb) && fb !== initialModel) {
        candidates.push(fb);
      }
    }

    for (const candidate of candidates.slice(0, 1)) {
      const retry = await tryModel(candidate);
      if (retry.ok) {
        cachedWorkingModel = retry.modelUsed;
        return retry;
      }
    }
  }

  return attempt;
}

export async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const attempt = await callGeminiGenerateContent(apiKey, {
      contents: [{ parts: [{ text: 'Hello' }] }],
    });

    if (attempt.ok) {
      return { valid: true };
    }

    const message = attempt.data?.error?.message || 'Invalid API key';

    if (attempt.status === 400) {
      return { valid: false, error: message || 'API key not accepted. Please check and try again.' };
    } else if (attempt.status === 429) {
      return { valid: false, error: 'Google project quota limit reached.' };
    }
    return { valid: false, error: message };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Network connection failed.' };
  }
}

export async function requestEssayEvaluation(
  apiKey: string,
  essayText: string,
  questionType: 'Q53' | 'Q54',
  promptTopic: string
): Promise<AiEvaluationResponse> {
  const maxScore = questionType === 'Q53' ? 30 : 50;

  const systemPrompt = `You are an expert official TOPIK II (Test of Proficiency in Korean) essay examiner and writing coach.
The user is a Myanmar student learning Korean writing for TOPIK II ${questionType}.
Your task is to thoroughly analyze the user's Korean essay based on official TOPIK II scoring rubric.
IMPORTANT: All explanations, overall summary, strengths, improvements, and grammar comments MUST be written in clear, polite Myanmar (Burmese) language, while Korean examples and corrections remain in Korean.

Scoring dimensions:
- For Q53 (Max score 30):
  - Content & task achievement (내용 및 과제 수행) max 10
  - Text structure & coherence (글의 전개 구조) max 10
  - Language use (어휘 및 문법) max 10
- For Q54 (Max score 50):
  - Content & task completion (내용 및 과제 수행) max 20
  - Text organization & logic (글의 논리적 전개 구조) max 15
  - Academic language use & style (어휘 및 문법의 정확성과 다양성) max 15

The estimatedScore MUST equal the sum of the three dimension scores.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "estimatedScore": <number between 0 and ${maxScore}>,
  "overallSummary": "<2-3 encouraging and constructive sentences in Myanmar summarizing the writing>",
  "structureRating": {
    "score": <number>,
    "max": <number>,
    "comment": "<constructive feedback in Myanmar on paragraph flow and transition words>"
  },
  "contentRating": {
    "score": <number>,
    "max": <number>,
    "comment": "<feedback in Myanmar on topic coverage and arguments>"
  },
  "languageRating": {
    "score": <number>,
    "max": <number>,
    "comment": "<feedback in Myanmar on grammar correctness and academic tone>"
  },
  "strengths": [
    "<strength 1 in Myanmar>",
    "<strength 2 in Myanmar>"
  ],
  "improvements": [
    "<actionable suggestion 1 in Myanmar>",
    "<actionable suggestion 2 in Myanmar>"
  ],
  "grammarCorrections": [
    {
      "original": "<original Korean snippet with error>",
      "corrected": "<corrected Korean>",
      "explanation": "<why this was corrected in Myanmar>"
    }
  ],
  "vocabularySuggestions": [
    {
      "spokenWord": "<everyday or spoken Korean used>",
      "academicAlternative": "<academic written alternative>",
      "reason": "<why the academic alternative scores higher in Myanmar>"
    }
  ]
}`;

  const userPrompt = `Question Type: TOPIK II ${questionType}
Prompt Topic: ${promptTopic}
User's Essay:
"""
${essayText}
"""

Please evaluate this essay according to the instructions and return only JSON.`;

  try {
    const attempt = await callGeminiGenerateContent(apiKey, {
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    if (!attempt.ok) {
      const errData = attempt.data;
      const status = attempt.status;
      if (status === 429) {
        return {
          success: false,
          errorType: 'QUOTA',
          error: 'Google AI project quota reached. Please wait or check your key quota.',
        };
      }
      if (status === 400 || status === 403) {
        return {
          success: false,
          errorType: 'INVALID_KEY',
          error: errData.error?.message || 'Your Gemini key was not accepted. Please reconnect your key.',
        };
      }
      return {
        success: false,
        errorType: 'UNKNOWN',
        error: errData.error?.message || 'Failed to review essay.',
      };
    }

    const data = attempt.data;
    const rawText = extractGeminiText(data);

    if (!rawText) {
      return {
        success: false,
        errorType: 'UNKNOWN',
        error: 'No feedback generated from AI.',
      };
    }

    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch (_) {
      // Fallback: extract json from code block if needed
      const jsonMatch = rawText.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim());
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    if (!validateEssayEvaluation(parsed, questionType)) {
      return { success: false, errorType: 'UNKNOWN', error: 'The AI returned incomplete or inconsistent feedback. Please retry; no score has been recorded.' };
    }
    const result: AiEvaluationResult = {
      ...parsed,
      questionType, promptTopic, essayText, charCount: essayText.length, maxScore,
      evaluatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      result,
    };
  } catch (err: any) {
    return {
      success: false,
      errorType: 'NETWORK',
      error: err.message || 'Connection interrupted. Your draft is still saved.',
    };
  }
}

