import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export const testManager = {
    readTestFile: (repoPath: string, testFilePath: string): string | null => {
        const fullPath = path.join(repoPath, testFilePath);
        if (!fs.existsSync(fullPath)) {
            return null;
        }
        try {
            return fs.readFileSync(fullPath, 'utf-8');
        } catch (error) {
            console.error(`Error reading test file at ${fullPath}:`, error);
            return null;
        }
    },

    writeTestFile: (repoPath: string, testFilePath: string, content: string): void => {
        const fullPath = path.join(repoPath, testFilePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        try {
            fs.writeFileSync(fullPath, content);
        } catch (error) {
            console.error(`Error writing test file to ${fullPath}:`, error);
            throw error;
        }
    },

    listTestFiles: async (repoPath: string): Promise<string[]> => {
        try {
            // Look for .test.ts or .spec.ts files
            const files = await glob('**/*.{test,spec}.{ts,js}', {
                cwd: repoPath,
                ignore: ['node_modules/**']
            });
            return files;
        } catch (error) {
            console.error('Error listing test files:', error);
            return [];
        }
    }
};
