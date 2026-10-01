import { GoogleGenAI } from '@google/genai';
import { ServiceCategory } from '../types';
import { DiagnosisResult, diagnoseProblemWithRules } from './problemDiagnosis';

export async function diagnoseWithAI(
  userInput: string,
  categories: ServiceCategory[]
): Promise<DiagnosisResult> {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
                 (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY);

  // If no API key or in browser where direct key might not be present, use our robust rule-based engine
  if (!apiKey) {
    return diagnoseProblemWithRules(userInput, categories);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const categoryListStr = categories.map(c => `${c.id}: ${c.nameEn} / ${c.nameBn}`).join('\n');

    const prompt = `You are Servexa's smart problem diagnostic engine for Bangladesh home services.
A user described their problem: "${userInput}"

Available categories:
${categoryListStr}

Analyze the problem and respond ONLY in valid JSON matching this structure:
{
  "categoryId": "one of the available category IDs",
  "confidence": number between 70 and 99,
  "recommendedUrgency": "normal" | "today" | "emergency",
  "keySymptoms": ["symptom1", "symptom2"],
  "reasoningEn": "Short explanation in English (max 20 words)",
  "reasoningBn": "সংক্ষিপ্ত কারণ বাংলায় (সর্বোচ্চ ২০ শব্দ)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const matchedCategory = categories.find(c => c.id === parsed.categoryId) || categories[0];
    const fallback = diagnoseProblemWithRules(userInput, categories);

    return {
      categoryId: matchedCategory.id,
      categoryNameEn: matchedCategory.nameEn,
      categoryNameBn: matchedCategory.nameBn,
      confidence: parsed.confidence || fallback.confidence,
      recommendedUrgency: parsed.recommendedUrgency || fallback.recommendedUrgency,
      estimatedCostRange: fallback.estimatedCostRange,
      keySymptoms: parsed.keySymptoms?.length ? parsed.keySymptoms : fallback.keySymptoms,
      reasoningEn: parsed.reasoningEn || fallback.reasoningEn,
      reasoningBn: parsed.reasoningBn || fallback.reasoningBn,
    };
  } catch (error) {
    console.warn('Gemini diagnosis fallback to rules:', error);
    return diagnoseProblemWithRules(userInput, categories);
  }
}
