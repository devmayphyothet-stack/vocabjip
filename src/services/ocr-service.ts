import { callGeminiGenerateContent, extractGeminiText } from '@/services/gemini-service';

export interface UncertainWord {
  id: string;
  word: string;
  suggestedCorrection: string;
  confidence: number;
}

export interface OcrResult {
  extractedText: string;
  charCount: number;
  detectedQuestionType: 'Q53' | 'Q54';
  uncertainWords: UncertainWord[];
}

export async function extractKoreanHandwriting(
  base64Image: string,
  apiKey?: string | null
): Promise<{ success: boolean; result?: OcrResult; error?: string }> {
  if (!base64Image.trim()) return { success: false, error: 'No image was received. Please select your photo again.' };
  if (!apiKey?.trim()) return { success: false, error: 'Connect your Gemini key before scanning handwriting.' };
  // Extract only from the selected image.
  if (apiKey && apiKey.trim()) {
    try {
      const prompt = `You are a specialized Korean OCR and handwriting recognition engine for TOPIK II Wongoji (원고지) manuscript papers.
Carefully examine the handwritten Korean manuscript in this image.
Extract all the Korean text exactly as written, preserving paragraph spacing and punctuation.
Identify any 1-3 characters or words that may be ambiguous, blurry, or difficult to read due to handwriting style.

Return ONLY a valid JSON object matching this schema:
{
  "extractedText": "<the complete extracted Korean text>",
  "detectedQuestionType": "Q53" or "Q54",
  "uncertainWords": [
    {
      "id": "u1",
      "word": "<the ambiguous Korean word/character>",
      "suggestedCorrection": "<the most likely intended academic Korean word>",
      "confidence": <number between 0.4 and 0.9>
    }
  ]
}`;

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const attempt = await callGeminiGenerateContent(apiKey, {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      if (attempt.ok) {
        const data = attempt.data;
        const rawJson = extractGeminiText(data);
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (typeof parsed.extractedText !== 'string' || !parsed.extractedText.trim() || !['Q53', 'Q54'].includes(parsed.detectedQuestionType) || !Array.isArray(parsed.uncertainWords) || parsed.uncertainWords.some((word: any) => !word || typeof word.id !== 'string' || typeof word.word !== 'string' || typeof word.suggestedCorrection !== 'string' || typeof word.confidence !== 'number' || word.confidence < 0 || word.confidence > 1)) {
            return { success: false, error: 'The image could not be read reliably. Try a clearer photo.' };
          }
          return {
            success: true,
            result: {
              extractedText: parsed.extractedText || '',
              charCount: (parsed.extractedText || '').length,
              detectedQuestionType: parsed.detectedQuestionType === 'Q54' ? 'Q54' : 'Q53',
              uncertainWords: parsed.uncertainWords || [],
            },
          };
        }
      }
    } catch {
      return { success: false, error: 'Scanning could not finish. Your photo was not converted. Please retry.' };
    }
  }
  return { success: false, error: 'Could not read handwriting from this photo. Check your connection and Gemini key, then retry.' };
}
