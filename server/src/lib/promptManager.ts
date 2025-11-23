import fs from 'fs/promises';
import path from 'path';

const PROMPTS_FILE = path.join(__dirname, '../../prompts.json');

export type PromptType =
    | 'structureUseCase'
    | 'reviseUseCase'
    | 'generateTests'
    | 'reviseTests'
    | 'updateTestsFromSpec'
    | 'generateAgentInstructions';

export const promptManager = {
    getPromptTemplate: async (type: PromptType): Promise<string> => {
        try {
            const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
            const prompts = JSON.parse(data);
            return prompts[type] || '';
        } catch (error) {
            console.error(`Failed to load prompt for ${type}`, error);
            return '';
        }
    },

    savePromptTemplate: async (type: PromptType, content: string): Promise<void> => {
        try {
            const data = await fs.readFile(PROMPTS_FILE, 'utf-8');
            const prompts = JSON.parse(data);
            prompts[type] = content;
            await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
        } catch (error) {
            console.error(`Failed to save prompt for ${type}`, error);
            throw error;
        }
    },

    interpolate: (template: string, variables: Record<string, string>): string => {
        return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || '');
    }
};
