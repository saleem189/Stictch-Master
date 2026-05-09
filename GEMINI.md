# Gemini AI Integration Patterns

This document outlines how to integrate Gemini AI features into the Tailoring Empire ERP.

## 1. Core Model Strategy
- **Primary Model:** `gemini-1.5-flash` for high-speed, cost-effective operational intelligence.
- **Secondary Model:** `gemini-1.5-pro` for complex analytical reports or style synthesis.

## 2. Intelligence Features

### 2.1. Measurement Synthesis (Proposed)
- **Goal:** Convert raw numbers into descriptive fitting advice.
- **Prompt Pattern:**
  ```text
  You are an expert master tailor. Given the measurements: {{measurements}}, 
  generate a brief (1-sentence) fitting profile in {{language}}.
  ```
- **UI Spot:** Appears in `ClientDetails` modal as a "Tailor's Insight" badge.

### 2.2. Style Advice & Upselling
- **Goal:** Analyze client order history to suggest fabric types or silhouettes.
- **Prompt Pattern:**
  ```text
  Client History: {{orders}}. 
  Recent Trending Fabrics: {{inventory}}.
  Suggest 3 combinations that match this client's profile.
  ```

### 2.3. Voice-to-Order Entries
- **Goal:** Allow masters to dictate measurements while hands are busy.
- **Technicality:** Use Gemini Multimodal capabilities to parse audio blobs directly into structured JSON measurement objects.

## 3. Implementation Pattern

```typescript
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY!);

export async function generateTailorInsight(measurements: any, lang: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Translate these measurements into a master tailor's fitting summary in ${lang}: ${JSON.stringify(measurements)}`;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

## 4. Safety & Standards
- **PII Protection:** Never send client names or sensitive contact info to the API. Only send anonymized measurements or ID-less history.
- **Bilingual Response:** Always specify the target language (${lang}) in the prompt to match the user's current locale.
