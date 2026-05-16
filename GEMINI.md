# AI Integration Patterns

This project currently ships without an active AI feature in the production UI. Future AI work should be added behind a server-side boundary so private API keys are never exposed in the browser bundle.

## 1. Candidate Features

### Measurement Synthesis

Convert raw measurements into a short fitting summary for staff.

Prompt shape:

```text
You are an expert master tailor. Given these anonymized measurements:
{{measurements}}

Generate a one-sentence fitting profile in {{language}}.
```

### Style Advice

Suggest garment/fabric combinations from anonymized order history and inventory trends.

Prompt shape:

```text
Client order patterns:
{{anonymousOrderSummary}}

Available fabric categories:
{{inventorySummary}}

Suggest three fitting garment directions in {{language}}.
```

### Voice-to-Measurement Entry

Parse a tailor's spoken measurements into structured JSON. This should require confirmation before saving to Firestore.

## 2. Implementation Rules

- Do not inject private API keys into Vite client code.
- Put AI calls behind a server, Firebase Function, or trusted backend service.
- Do not send names, phone numbers, email addresses, or full addresses to an AI provider.
- Use anonymized IDs or aggregate summaries.
- Store AI-generated output as advisory text only; staff must confirm before it changes orders or measurements.
- Respect current `i18n.language` and explicitly request English or Urdu output.

## 3. Suggested Server Boundary

```ts
interface TailorInsightRequest {
  language: 'en' | 'ur';
  measurements: Record<string, number>;
}

interface TailorInsightResponse {
  summary: string;
}
```

Client flow:

1. Client or staff opens a measurement profile.
2. UI calls a trusted endpoint with anonymized measurements.
3. Endpoint calls the AI provider.
4. UI shows the response as an advisory badge.
5. Staff confirms before saving any derived notes.

## 4. Safety Checklist

- [ ] No secret key in browser bundle.
- [ ] No personally identifiable information in prompts.
- [ ] Prompt includes target language.
- [ ] Output is labeled as advisory.
- [ ] Firestore writes still go through existing validation and rules.
