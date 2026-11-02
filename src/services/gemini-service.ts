import { AiEvaluationResult, AiEvaluationResponse, AiErrorType } from '@/types/ai';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function validateGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }],
      }),
    });

    if (res.ok) {
      return { valid: true };
    }

    const data = await res.json().catch(() => ({}));
    const message = data.error?.message || 'Invalid API key';

    if (res.status === 400) {
      return { valid: false, error: 'API key not accepted. Please check and try again.' };
    } else if (res.status === 429) {
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

Respond ONLY with a valid JSON object matching this exact schema:
{
  "estimatedScore": <number between 1 and ${maxScore}>,
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
    const url = `${GEMINI_API_URL}/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const status = response.status;
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
          error: 'Your Gemini key was not accepted. Please reconnect your key.',
        };
      }
      return {
        success: false,
        errorType: 'UNKNOWN',
        error: errData.error?.message || 'Failed to review essay.',
      };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

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

    const result: AiEvaluationResult = {
      questionType,
      promptTopic,
      essayText,
      charCount: essayText.length,
      estimatedScore: Math.min(maxScore, Math.max(1, parsed.estimatedScore || Math.round(maxScore * 0.7))),
      maxScore,
      overallSummary: parsed.overallSummary || 'စာရေးသားမှု ကောင်းမွန်ပါသည်။ အသေးစိတ် အကြံပြုချက်များကို လေ့လာပါ။',
      structureRating: parsed.structureRating || {
        score: Math.round(maxScore * 0.3),
        max: Math.round(maxScore * 0.33),
        comment: 'စာပိုဒ်ဖွဲ့စည်းပုံ ရှင်းလင်းပါသည်။',
      },
      contentRating: parsed.contentRating || {
        score: Math.round(maxScore * 0.3),
        max: Math.round(maxScore * 0.33),
        comment: 'အဓိက အချက်အလက်များ ပြည့်စုံပါသည်။',
      },
      languageRating: parsed.languageRating || {
        score: Math.round(maxScore * 0.3),
        max: Math.round(maxScore * 0.33),
        comment: 'သဒ္ဒါနှင့် ဝေါဟာရ အသုံးပြုမှု ကောင်းမွန်ပါသည်။',
      },
      strengths: parsed.strengths || ['ဝေါဟာရ အသုံးအနှုန်း ကောင်းမွန်ခြင်း'],
      improvements: parsed.improvements || ['အပိုဒ်ကူး စကားလုံးများကို ပိုမို အသုံးပြုပါ'],
      grammarCorrections: parsed.grammarCorrections || [],
      vocabularySuggestions: parsed.vocabularySuggestions || [],
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

