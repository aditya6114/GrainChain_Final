import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '../types/env.schema'

// Gemini client — used only by the AI enrichment job (BullMQ worker).
// We use gemini-1.5-flash: fast, free tier, good at structured JSON output.
//
// We export a function rather than the raw client so the job can call
// generateEnrichment() without knowing anything about the Gemini SDK.

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY ?? '')

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  // Force JSON output — Gemini will always return valid JSON when this is set.
  // Without this, the model might wrap JSON in markdown code blocks (```json ... ```)
  // which would break our Zod parsing.
  generationConfig: {
    responseMimeType: 'application/json',
  },
})
