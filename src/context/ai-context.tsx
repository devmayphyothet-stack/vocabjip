import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateGeminiKey, requestEssayEvaluation } from '@/services/gemini-service';
import { AiEvaluationResponse, AiEvaluationResult } from '@/types/ai';

const STORAGE_KEYS = {
  GEMINI_API_KEY: '@vocabjip/gemini_api_key',
  LAST_EVALUATION: '@vocabjip/last_evaluation',
};

interface AiContextType {
  apiKey: string | null;
  isConnected: boolean;
  maskedKey: string | null;
  isConnecting: boolean;
  latestEvaluation: AiEvaluationResult | null;
  connectKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  removeKey: () => Promise<void>;
  evaluateEssay: (
    essayText: string,
    questionType: 'Q53' | 'Q54',
    promptTopic: string
  ) => Promise<AiEvaluationResponse>;
  setLatestEvaluation: (res: AiEvaluationResult | null) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] = useState<AiEvaluationResult | null>(null);

  // Load saved key on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedKey, savedEval] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY),
          AsyncStorage.getItem(STORAGE_KEYS.LAST_EVALUATION),
        ]);
        if (savedKey) {
          setApiKey(savedKey);
        }
        if (savedEval) {
          setLatestEvaluation(JSON.parse(savedEval));
        }
      } catch (e) {
        console.warn('Failed to load saved AI key:', e);
      }
    })();
  }, []);

  const maskedKey = apiKey
    ? `Key ending in ....${apiKey.slice(-4).toUpperCase()}`
    : null;

  const connectKey = async (rawKey: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = rawKey.trim();
    if (!trimmed) {
      return { success: false, error: 'Please enter a valid Gemini API key.' };
    }

    setIsConnecting(true);
    try {
      const check = await validateGeminiKey(trimmed);
      if (!check.valid) {
        return { success: false, error: check.error || 'Invalid API key.' };
      }

      setApiKey(trimmed);
      await AsyncStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, trimmed);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Verification failed.' };
    } finally {
      setIsConnecting(false);
    }
  };

  const removeKey = async () => {
    setApiKey(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.GEMINI_API_KEY);
  };

  const evaluateEssay = async (
    essayText: string,
    questionType: 'Q53' | 'Q54',
    promptTopic: string
  ): Promise<AiEvaluationResponse> => {
    if (!apiKey) {
      return {
        success: false,
        errorType: 'INVALID_KEY',
        error: 'Please connect your Gemini API key first.',
      };
    }

    const response = await requestEssayEvaluation(
      apiKey,
      essayText,
      questionType,
      promptTopic
    );

    if (response.success && response.result) {
      setLatestEvaluation(response.result);
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_EVALUATION,
        JSON.stringify(response.result)
      );
    }

    return response;
  };

  return (
    <AiContext.Provider
      value={{
        apiKey,
        isConnected: Boolean(apiKey),
        maskedKey,
        isConnecting,
        latestEvaluation,
        connectKey,
        removeKey,
        evaluateEssay,
        setLatestEvaluation,
      }}>
      {children}
    </AiContext.Provider>
  );
}

export function useAi(): AiContextType {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
}
