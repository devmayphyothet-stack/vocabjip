import { StatementAiFeedback } from '@/types/statement';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function evaluatePersonalStatement(
  apiKey: string,
  sectionTitle: string,
  koreanText: string,
  targetUniversity?: string,
  targetMajor?: string
): Promise<{ success: boolean; result?: StatementAiFeedback; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'Please connect your Gemini API key.' };
  }

  const systemPrompt = `You are an esteemed Korean University Admissions Committee Professor (대입/대학원 입학사정관).
The user is an international student from Myanmar applying to a Korean university.
They are writing their Personal Statement (자기소개서 - ${sectionTitle}).
Target University: ${targetUniversity || 'Korean University'}
Target Major: ${targetMajor || 'General Studies'}

Review the student's Korean personal statement draft with high academic scrutiny:
1. Tone and formality: Must use formal academic writing style (~(으)ㅂ니다 / ~다 / ~하였습니다).
2. Authenticity: Avoid vague clichés, look for concrete experiences and clear personal voice.
3. Logical coherence: Clear connection between motivation, capability, and future plan.
4. Language of feedback: ALL explanations, professor impression, strengths, and improvements MUST be in clear, polite Myanmar (Burmese) language, while Korean original and enhanced sentences remain in Korean.

Respond ONLY with valid JSON matching this schema:
{
  "toneScore": <number 1-10>,
  "clarityScore": <number 1-10>,
  "overallFeedback": "<2-3 encouraging sentences in Myanmar>",
  "professorImpression": "<1-2 sentences in Myanmar representing how a Korean professor would perceive this applicant>",
  "strengths": [
    "<strength 1 in Myanmar>",
    "<strength 2 in Myanmar>"
  ],
  "keyImprovements": [
    "<actionable advice 1 in Myanmar>",
    "<actionable advice 2 in Myanmar>"
  ],
  "sentenceImprovements": [
    {
      "original": "<original Korean sentence>",
      "enhanced": "<refined, more impactful academic Korean sentence>",
      "reason": "<why this sounds much better to admissions professors in Myanmar>"
    }
  ]
}`;

  const userPrompt = `Section: ${sectionTitle}
Student's Statement Draft:
"""
${koreanText}
"""

Please evaluate this personal statement and return JSON only.`;

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
      const err = await response.json().catch(() => ({}));
      return { success: false, error: err.error?.message || 'Failed to review statement.' };
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJson) {
      return { success: false, error: 'No feedback generated from AI.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (_) {
      const match = rawJson.match(/```(?:json)?([\s\S]*?)```/);
      if (match) parsed = JSON.parse(match[1].trim());
      else throw new Error('Could not parse response');
    }

    const result: StatementAiFeedback = {
      toneScore: parsed.toneScore || 8,
      clarityScore: parsed.clarityScore || 8,
      overallFeedback:
        parsed.overallFeedback ||
        'အခြေခံ ရည်ရွယ်ချက်ဖော်ပြမှု ရှင်းလင်းပါသည်။ ပိုမိုခိုင်မာစေရန် အသေးစိတ် အချက်အလက်များ ထပ်ဖြည့်နိုင်ပါသည်။',
      professorImpression:
        parsed.professorImpression ||
        'စိတ်အားထက်သန်မှုရှိပြီး ရည်မှန်းချက်ရှင်းလင်းသော လျှောက်ထားသူတစ်ဦးအဖြစ် ရှုမြင်ခံရနိုင်ပါသည်။',
      strengths: parsed.strengths || ['လျှောက်ထားရခြင်း ရည်ရွယ်ချက် ပေါ်လွင်ခြင်း'],
      keyImprovements: parsed.keyImprovements || ['လက်တွေ့ အတွေ့အကြုံ ဥပမာတစ်ခု ထပ်ဖြည့်ပါ'],
      sentenceImprovements: parsed.sentenceImprovements || [],
    };

    return { success: true, result };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Connection interrupted. Please try again.',
    };
  }
}

