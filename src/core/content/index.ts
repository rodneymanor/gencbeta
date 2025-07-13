// Content Service - Centralized content generation and processing
export * from './peq-extractor';
export * from './template-generator';
export * from './script-validator';
export * from './negative-keywords';
export * from './voice-processor';

// Content service instance for easy importing
import { generateSpeedWriteScript, generateEducationalScript, generateAIVoiceScript } from './template-generator';
import { extractPEQ } from './peq-extractor';
import { validateScript } from './script-validator';
import { getEffectiveNegativeKeywordsForUser } from './negative-keywords';

// Placeholder functions for missing services (to be implemented)
async function processVoiceCreation(userId: string, request: any) {
  // TODO: Implement voice creation logic
  throw new Error("Voice creation not yet implemented in content service");
}

async function getUserCollections(userId: string) {
  // TODO: Implement collection retrieval logic
  throw new Error("Collection retrieval not yet implemented in content service");
}

async function createCollection(userId: string, data: { title: string; description: string }) {
  // TODO: Implement collection creation logic
  throw new Error("Collection creation not yet implemented in content service");
}

export const contentService = {
  generateSpeedWriteScript,
  generateEducationalScript,
  generateAIVoiceScript,
  extractPEQ,
  validateScript,
  getEffectiveNegativeKeywordsForUser,
  processVoiceCreation,
  getUserCollections,
  createCollection,
}; 