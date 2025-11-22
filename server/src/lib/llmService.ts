import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAkPlWBn_eEPbcnN9FHHsXbpNL85sxQCxs';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

export const llmService = {
  structureUseCase: async (description: string): Promise<string> => {
    const prompt = `
      You are an expert software architect.
      Please convert the following raw use case description into a structured Markdown specification.
      The specification should include:
      - Title
      - Description
      - Actors
      - Preconditions
      - Main Flow (numbered list)
      - Alternative Flows
      - Postconditions

      Raw Description:
      ${description}
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  reviseUseCase: async (currentSpec: string, instructions: string): Promise<string> => {
    const prompt = `
      You are an expert software architect.
      Please revise the following use case specification based on the instructions provided.
      Return ONLY the updated Markdown specification.

      Current Spec:
      ${currentSpec}

      Instructions:
      ${instructions}
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  generateTests: async (spec: string, type: 'unit' | 'integration'): Promise<string> => {
    const prompt = `
      You are an expert QA engineer and developer.
      Based on the following use case specification, generate ${type} tests in TypeScript.
      Return ONLY the code block for the tests. Do not include markdown formatting like \`\`\`typescript.

      Specification:
      ${spec}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Strip markdown code blocks if present
    return text.replace(/^```typescript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
  },

  reviseTests: async (currentTests: string, instructions: string): Promise<string> => {
    const prompt = `
      You are an expert developer.
      Please revise the following test code based on the instructions.
      Return ONLY the updated code.

      Current Tests:
      ${currentTests}

      Instructions:
      ${instructions}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text.replace(/^```typescript\n/, '').replace(/^```\n/, '').replace(/\n```$/, '');
  },

  generateAgentInstructions: async (spec: string, testPaths: string[]): Promise<string> => {
    const prompt = `
      You are a technical lead.
      Generate a clear set of instructions for an AI coding agent to implement the features described in the spec.
      Include references to the test files that need to pass.

      Spec:
      ${spec}

      Test Files:
      ${testPaths.join(', ')}
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
};
