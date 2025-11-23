import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBR6rux2u9u-zCUCLbBPjxv9g4BcAee-Y8';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

const generateWithRetry = async (prompt: string, retries = 5, delay = 5000): Promise<string> => {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
      console.log(`Rate limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(prompt, retries - 1, delay * 2);
    }
    throw error;
  }
};

import { promptManager } from './promptManager';

// ... (generateWithRetry remains the same)

export const llmService = {
  structureUseCase: async (description: string, title?: string, currentSpec?: string, customPromptTemplate?: string): Promise<string> => {
    const template = customPromptTemplate || await promptManager.getPromptTemplate('structureUseCase');
    const prompt = promptManager.interpolate(template, {
      title: title || 'Untitled',
      existingSpec: currentSpec ? `Existing Specification Content:\n${currentSpec}\n` : '',
      description
    });
    return generateWithRetry(prompt);
  },

  reviseUseCase: async (currentSpec: string, instructions: string, customPromptTemplate?: string): Promise<string> => {
    const template = customPromptTemplate || await promptManager.getPromptTemplate('reviseUseCase');
    const prompt = promptManager.interpolate(template, {
      currentSpec,
      instructions
    });
    return generateWithRetry(prompt);
  },

  generateTests: async (spec: string, type: 'unit' | 'integration', customPromptTemplate?: string): Promise<string> => {
    const template = customPromptTemplate || await promptManager.getPromptTemplate('generateTests');
    const prompt = promptManager.interpolate(template, {
      type,
      spec
    });
    const text = await generateWithRetry(prompt);
    return text.replace(/^```typescript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
  },

  reviseTests: async (currentTests: string, instructions: string, customPromptTemplate?: string): Promise<string> => {
    const template = customPromptTemplate || await promptManager.getPromptTemplate('reviseTests');
    const prompt = promptManager.interpolate(template, {
      currentTests,
      instructions
    });
    const text = await generateWithRetry(prompt);
    return text.replace(/^```typescript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
  },

  updateTestsFromSpec: async (currentTests: string, newSpec: string, customPromptTemplate?: string): Promise<string> => {
    const template = customPromptTemplate || await promptManager.getPromptTemplate('updateTestsFromSpec');
    const prompt = promptManager.interpolate(template, {
      newSpec,
      currentTests
    });
    const text = await generateWithRetry(prompt);
    return text.replace(/^```typescript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
  },

  generateAgentInstructions: async (spec: string, testPaths: string[], customPromptTemplate?: string): Promise<string> => {
    const template = customPromptTemplate || await promptManager.getPromptTemplate('generateAgentInstructions');
    const prompt = promptManager.interpolate(template, {
      spec,
      testFiles: testPaths.join(', ')
    });
    return generateWithRetry(prompt);
  }
};
