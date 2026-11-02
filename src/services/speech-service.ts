import * as Speech from 'expo-speech';

export interface SpeechOptions {
  rate?: number; // 0.85 = comfortable language learning pace
  pitch?: number;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export class SpeechService {
  /**
   * Pronounce Korean text with native Korean voice
   */
  static async speakKorean(text: string, options?: SpeechOptions): Promise<void> {
    if (!text || !text.trim()) return;

    try {
      // Stop any existing speech before starting a new one
      await Speech.stop();

      Speech.speak(text.trim(), {
        language: 'ko-KR',
        rate: options?.rate ?? 0.88, // Slightly relaxed pace for learners
        pitch: options?.pitch ?? 1.0,
        onDone: () => {
          options?.onDone?.();
        },
        onError: (err) => {
          options?.onError?.(err);
        },
      });
    } catch (error) {
      console.warn('[SpeechService] Speak error:', error);
      options?.onDone?.();
    }
  }

  /**
   * Stop current audio playback
   */
  static async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.warn('[SpeechService] Stop error:', error);
    }
  }

  /**
   * Check if speech is currently active
   */
  static async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}

